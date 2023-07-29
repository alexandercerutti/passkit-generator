const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { PKPass } = require("passkit-generator");
const fs = require("node:fs");
const path = require("node:path");
const axios = require("axios");
const os = require("node:os");

// Firebase init
admin
	.initializeApp
	// {
	// 	credential: admin.credential.cert(require("CERTIFICATE_PATH")),
	// 	storageBucket: "STORAGE_BUCKET_URL",
	// }
	();

const storageRef = admin.storage().bucket();

exports.pass = functions.https.onRequest(async (request, response) => {
	const newPass = await PKPass.from(
		{
			// Get relevant pass model from model folder (see passkit-generator/examples/models/)
			model: `./model/${request.body.passType}.pass`,
			certificates: {
				// Assigning certificates from certs folder (you will need to provide these yourself)
				wwdr: process.env.WWDR,
				signerCert: process.env.SIGNER_CERT,
				signerKey: process.env.SIGNER_KEY,
				signerKeyPassphrase: process.env.SIGNER_KEY_PASSPHRASE,
			},
		},
		{
			serialNumber: request.body.serialNumber,
			description: "DESCRIPTION",
			logoText: request.body.logoText,
			foregroundColor: request.body.textColor,
			backgroundColor: request.body.backgroundColor,
			labelColor: request.body.labelColor,
		},
	);

	if (newPass.type == "boardingPass") {
		newPass.transitType = `PKTransitType${request.body.transitType}`;
	}

	if (request.body.relevantDate !== "Blank") {
		newPass.setRelevantDate(new Date(request.body.relevantDate));
	}

	if (request.body.expiryDate !== "Blank") {
		newPass.setExpirationDate(new Date(request.body.expiryDate));
	}

	if (
		request.body.relevantLocationLat !== "Blank" &&
		request.body.relevantLocationLong !== "Blank"
	) {
		newPass.setLocations({
			latitude: request.body.relevantLocationLat,
			longitude: request.body.relevantLocationLong,
		});
	}

	for (let i = 0; i < request.body.header.length; i++) {
		const field = request.body.header[i];

		if (!(field.label && field.value)) {
			continue;
		}

		newPass.headerFields.push({
			key: `header${i}`,
			label: field.label,
			value: field.value,
		});
	}

	for (let i = 0; i < request.body.primary.length; i++) {
		const field = request.body.primary[i];

		if (!(field.label && field.value)) {
			continue;
		}

		newPass.primaryFields.push({
			key: `primary${i}`,
			label: field.label,
			value:
				newPass.type == "boardingPass"
					? field.value.toUpperCase()
					: field.value,
		});
	}

	for (let i = 0; i < request.body.secondary.length; i++) {
		const field = request.body.secondary[i];

		if (!(field.label && field.value)) {
			continue;
		}

		const isElementInLastTwoPositions =
			index === request.body.secondary.length - 2 ||
			index === request.body.secondary.length - 1;

		newPass.secondaryFields.push({
			key: `secondary${i}`,
			label: field.label,
			value: field.value,
			textAlignment: isElementInLastTwoPositions
				? "PKTextAlignmentRight"
				: "PKTextAlignmentLeft",
		});
	}

	for (let i = 0; i < request.body.auxiliary.length; i++) {
		const field = request.body.auxiliary[i];

		if (!(field.label && field.value)) {
			continue;
		}

		const isElementInLastTwoPositions =
			index === request.body.auxiliary.length - 2 ||
			index === request.body.auxiliary.length - 1;

		newPass.auxiliaryFields.push({
			key: `auxiliary${i}`,
			label: field.label,
			value: field.value,
			textAlignment: isElementInLastTwoPositions
				? "PKTextAlignmentRight"
				: "PKTextAlignmentLeft",
		});
	}

	if (!request.body.codeAlt || request.body.codeAlt.trim() === "") {
		newPass.setBarcodes({
			message: request.body.qrText,
			format: `PKBarcodeFormat${request.body.codeType}`,
			messageEncoding: "iso-8859-1",
		});
	} else {
		newPass.setBarcodes({
			message: request.body.qrText,
			format: `PKBarcodeFormat${request.body.codeType}`,
			messageEncoding: "iso-8859-1",
			altText: request.body.codeAlt,
		});
	}

	// Downloading thumbnail and logo files from Firebase Storage and adding to pass
	if (newPass.type == "generic" || newPass.type == "eventTicket") {
		const thumbnailFile = request.body.thumbnailFile;
		const tempPath1 = path.join(os.tmpdir(), thumbnailFile);
		try {
			await storageRef
				.file(`thumbnails/${thumbnailFile}`)
				.download({ destination: tempPath1 });
		} catch (error) {
			console.error(error);
		}
		let buffer = Buffer.alloc(0);
		try {
			buffer = fs.readFileSync(tempPath1);
		} catch (error) {
			console.error(error);
		}
		newPass.addBuffer("thumbnail.png", buffer);
		newPass.addBuffer("thumbnail@2x.png", buffer);
	}

	const logoFile = request.body.logoFile;
	const tempPath2 = path.join(os.tmpdir(), logoFile);
	try {
		await storageRef
			.file(`logos/${logoFile}`)
			.download({ destination: tempPath2 });
	} catch (error) {
		console.error(error);
	}
	let buffer = Buffer.alloc(0);
	try {
		buffer = fs.readFileSync(tempPath2);
	} catch (error) {
		console.error(error);
	}
	newPass.addBuffer("logo.png", buffer);
	newPass.addBuffer("logo@2x.png", buffer);

	const bufferData = newPass.getAsBuffer();
	try {
		console.log("Pass was uploaded successfully.");
		response.set("Content-Type", newPass.mimeType);
		response.status(200).send(bufferData);

		// Delete thumbnail file in Firebase Storage
		storageRef
			.file(`thumbnails/${thumbnailFile}`)
			.delete()
			.then(() => {
				console.log("Thumbnail file deleted successfully");
			})
			.catch((error) => {
				console.error(error);
			});

		// Delete logo file in Firebase Storage
		storageRef
			.file(`logos/${logoFile}`)
			.delete()
			.then(() => {
				console.log("Logo file deleted successfully");
			})
			.catch((error) => {
				console.error(error);
			});
	} catch (error) {
		console.log("Error Uploading pass " + error);
		response.send({
			explanation: error.message,
			result: "FAILED",
		});
	}
});
