/**
 * This examples shows how you can create a PKPass from scratch,
 * by adding files later and not adding pass.json
 */

import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { PKPass } from "passkit-generator";
import { app } from "./webserver.js";
import { getCertificates } from "./shared.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getRandomColorPart() {
	return Math.floor(Math.random() * 255);
}

app.route("/scratch/:modelName").get(async (request, response) => {
	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	const [iconFromModel, certificates] = await Promise.all([
		fs.readFile(
			path.resolve(
				__dirname,
				"../../models/exampleBooking.pass/icon.png",
			),
		),
		getCertificates(),
	]);

	try {
		const pass = new PKPass(
			{},
			{
				wwdr: certificates.wwdr,
				signerCert: certificates.signerCert,
				signerKey: certificates.signerKey,
				signerKeyPassphrase: certificates.signerKeyPassphrase,
			},
			{
				...(request.body || request.params || request.query),
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

		const stream = pass.getAsStream();

		response.set({
			"Content-type": pass.mimeType,
			"Content-disposition": `attachment; filename=${passName}.pkpass`,
		});

		stream.pipe(response);
	} catch (err) {
		console.log(err);

		response.set({
			"Content-type": "text/html",
		});

		response.send(err.message);
	}
});
