import * as functions from "firebase-functions";
import admin from "firebase-admin";
import passkit from "passkit-generator";
import type { Barcode, TransitType } from "passkit-generator";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const PKPass = passkit.PKPass;

// Firebase init
admin
	.initializeApp
	// {
	// 	credential: admin.credential.cert(require("CERTIFICATE_PATH")),
	// 	storageBucket: "STORAGE_BUCKET_URL",
	// }
	();

const storageRef = admin.storage().bucket();

interface RequestWithBody extends functions.Request {
	body: {
		passModel: string;
		serialNumber: string;
		logoText: string;
		textColor: string;
		backgroundColor: string;
		labelColor: string;
		relevantDate?: string;
		expiryDate?: string;
		relevantLocationLat?: number;
		relevantLocationLong?: number;
		header?: { value: string; label: string }[];
		primary?: { value: string; label: string }[];
		secondary?: { value: string; label: string }[];
		auxiliary?: { value: string; label: string }[];
		codeAlt?: string;
		qrText?: string;
		transitType?: TransitType;
		codeType?: Barcode["format"];
		thumbnailFile?: string;
		logoFile?: string;
	};
}

// Declaring our .env contents
declare global {
	namespace NodeJS {
		interface ProcessEnv {
			WWDR: string;
			SIGNER_CERT: string;
			SIGNER_KEY: string;
			SIGNER_KEY_PASSPHRASE: string;
		}
	}
}

export const pass = functions.https.onRequest(
	async (request: RequestWithBody, response) => {
		if (request.headers["content-type"] !== "application/json") {
			response.status(400);
			response.send({
				error: `Payload with content-type ${request.headers["content-type"]} is not supported. Use "application/json"`,
			});
			return;
		}

		if (!request.body.passModel) {
			response.status(400);
			response.send({
				error: "Unspecified 'passModel' parameter: which model should be used?",
			});

			return;
		}

		if (request.body.passModel.endsWith(".pass")) {
			request.body.passModel = request.body.passModel.replace(
				".pass",
				"",
			);
		}

		const newPass = await PKPass.from(
			{
				/**
				 * Get relevant pass model from model folder (see passkit-generator/examples/models/)
				 * Path seems to get read like the function is in "firebase/" folder and not in "firebase/functions/"
				 */
				model: `../../models/${request.body.passModel}.pass`,
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
			if (!request.body.transitType) {
				response.status(400);
				response.send({
					error: "transitType is required",
				});

				return;
			}

			newPass.transitType = request.body.transitType;
		}

		if (typeof request.body.relevantDate === "string") {
			newPass.setRelevantDate(new Date(request.body.relevantDate));
		}

		if (typeof request.body.expiryDate === "string") {
			newPass.setExpirationDate(new Date(request.body.expiryDate));
		}

		if (
			request.body.relevantLocationLat &&
			request.body.relevantLocationLong
		) {
			newPass.setLocations({
				latitude: request.body.relevantLocationLat,
				longitude: request.body.relevantLocationLong,
			});
		}

		if (Array.isArray(request.body.header)) {
			for (let i = 0; i < request.body.header.length; i++) {
				const field = request.body.header[i];

				if (!(field?.label && field.value)) {
					continue;
				}

				newPass.headerFields.push({
					key: `header${i}`,
					label: field.label,
					value: field.value,
				});
			}
		}

		if (Array.isArray(request.body.primary)) {
			for (let i = 0; i < request.body.primary.length; i++) {
				const field = request.body.primary[i];

				if (!(field?.label && field.value)) {
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
		}

		if (Array.isArray(request.body.secondary)) {
			for (let i = 0; i < request.body.secondary.length; i++) {
				const field = request.body.secondary[i];

				if (!(field?.label && field.value)) {
					continue;
				}

				const isElementInLastTwoPositions =
					i === request.body.secondary.length - 2 ||
					i === request.body.secondary.length - 1;

				newPass.secondaryFields.push({
					key: `secondary${i}`,
					label: field.label,
					value: field.value,
					textAlignment: isElementInLastTwoPositions
						? "PKTextAlignmentRight"
						: "PKTextAlignmentLeft",
				});
			}
		}

		if (Array.isArray(request.body.auxiliary)) {
			for (let i = 0; i < request.body.auxiliary.length; i++) {
				const field = request.body.auxiliary[i];

				if (!(field?.label && field.value)) {
					continue;
				}

				const isElementInLastTwoPositions =
					i === request.body.auxiliary.length - 2 ||
					i === request.body.auxiliary.length - 1;

				newPass.auxiliaryFields.push({
					key: `auxiliary${i}`,
					label: field.label,
					value: field.value,
					textAlignment: isElementInLastTwoPositions
						? "PKTextAlignmentRight"
						: "PKTextAlignmentLeft",
				});
			}
		}

		if (request.body.qrText && request.body.codeType) {
			newPass.setBarcodes({
				message: request.body.qrText,
				format: request.body.codeType,
				messageEncoding: "iso-8859-1",
				altText: request.body.codeAlt?.trim() ?? "",
			});
		}

		const { thumbnailFile, logoFile } = request.body;

		// Downloading thumbnail and logo files from Firebase Storage and adding to pass
		if (newPass.type == "generic" || newPass.type == "eventTicket") {
			if (thumbnailFile) {
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
		}

		if (logoFile) {
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
		}

		const bufferData = newPass.getAsBuffer();
		try {
			console.log("Pass was uploaded successfully.");

			response.set("Content-Type", newPass.mimeType);
			response.status(200).send(bufferData);

			// Delete thumbnail file in Firebase Storage
			storageRef
				.file(`thumbnails/${request.body.thumbnailFile}`)
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
				explanation: JSON.stringify(error),
				result: "FAILED",
			});
		}
	},
);
