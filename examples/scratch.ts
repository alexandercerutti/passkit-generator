/**
 * This examples shows how you can create a PKPass from scratch,
 * by adding files later and not adding pass.json
 */

import app from "./webserver";
import path from "path";
import { PKPass } from "passkit-generator";

app.all(async function manageRequest(request, response) {
	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	try {
		const pass = new PKPass(
			{},
			{
				wwdr: path.resolve(__dirname, "../../certificates/WWDR.pem"),
				signerCert: path.resolve(
					__dirname,
					"../../certificates/signerCert.pem",
				),
				signerKey: path.resolve(
					__dirname,
					"../../certificates/signerKey.pem",
				),
				signerKeyPassphrase: "123456",
			},
			request.body || request.params || request.query,
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
