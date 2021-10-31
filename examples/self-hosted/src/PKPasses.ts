/**
 * PKPasses generation through PKPass.pack static method
 * example.
 * Here it is showed manual model reading and
 * creating through another PKPass because in the other
 * examples, creation through templates is already shown
 *
 * PLEASE NOTE THAT, AT TIME OF WRITING, THIS EXAMPLE WORKS
 * ONLY IF PASSES ARE DOWNLOADED FROM SAFARI, due to the
 * support of PKPasses archives. To test this, you might
 * need to open a tunnel through NGROK if you cannot access
 * to your local machine (in my personal case, developing
 * under WSL is a pretty big limitation sometimes).
 *
 * @TODO test again this example with next iOS 15 versions.
 * Currently, pass viewer seems to be soooo bugged.
 *
 * https://imgur.com/bDTbcDg.jpg
 * https://imgur.com/Y4GpuHT.jpg
 * https://i.imgur.com/qbJMy1d.jpg
 *
 * Alberto, come to look at APPLE.
 *
 * MAMMA MIA!
 *
 * A feedback to Apple have been sent for this.
 */

import { app } from "./webserver";
import { getCertificates } from "./shared";
import { promises as fs } from "fs";
import path from "path";
import { PKPass } from "passkit-generator";

// *************************** //
// *** EXAMPLE FROM NOW ON *** //
// *************************** //

function getRandomColorPart() {
	return Math.floor(Math.random() * 255);
}

async function generatePass(props: Object) {
	const [iconFromModel, certificates] = await Promise.all([
		fs.readFile(
			path.resolve(
				__dirname,
				"../../models/exampleBooking.pass/icon.png",
			),
		),
		getCertificates(),
	]);

	const pass = new PKPass(
		{},
		{
			wwdr: certificates.wwdr,
			signerCert: certificates.signerCert,
			signerKey: certificates.signerKey,
			signerKeyPassphrase: certificates.signerKeyPassphrase,
		},
		{
			...props,
			description: "Example Apple Wallet Pass",
			passTypeIdentifier: "pass.com.passkitgenerator",
			serialNumber: "nmyuxofgna",
			organizationName: `Test Organization ${Math.random()}`,
			teamIdentifier: "F53WB8AE67",
			foregroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
			labelColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
			backgroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
		},
	);

	pass.type = "boardingPass";
	pass.transitType = "PKTransitTypeAir";

	pass.setBarcodes({
		message: "123456789",
		format: "PKBarcodeFormatQR",
	});

	pass.headerFields.push(
		{
			key: "header-field-test-1",
			value: "Unknown",
		},
		{
			key: "header-field-test-2",
			value: "unknown",
		},
	);

	pass.primaryFields.push(
		{
			key: "primaryField-1",
			value: "NAP",
		},
		{
			key: "primaryField-2",
			value: "VCE",
		},
	);

	/**
	 * Required by Apple. If one is not available, a
	 * pass might be openable on a Mac but not on a
	 * specific iPhone model
	 */

	pass.addBuffer("icon.png", iconFromModel);
	pass.addBuffer("icon@2x.png", iconFromModel);
	pass.addBuffer("icon@3x.png", iconFromModel);

	return pass;
}

app.route("/pkpasses/:modelName").get(async (request, response) => {
	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	try {
		const passes = await Promise.all([
			generatePass(request.body || request.params || request.query),
			generatePass(request.body || request.params || request.query),
			generatePass(request.body || request.params || request.query),
			generatePass(request.body || request.params || request.query),
		]);

		const pkpasses = PKPass.pack(...passes);

		response.set({
			"Content-type": pkpasses.mimeType,
			"Content-disposition": `attachment; filename=${passName}.pkpasses`,
		});

		const stream = pkpasses.getAsStream();

		stream.pipe(response);
	} catch (err) {
		console.log(err);

		response.set({
			"Content-type": "text/html",
		});

		response.send(err.message);
	}
});
