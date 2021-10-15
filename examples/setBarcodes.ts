/**
 * .barcodes() methods example
 * Here we set the barcode. To see all the results, you can
 * both unzip .pkpass file or check the properties before
 * generating the whole bundle
 *
 * Pass ?alt=true as querystring to test a barcode generate
 * by a string
 */

import app from "./webserver";
import { PKPass } from "passkit-generator";
import path from "path";

app.all(async function manageRequest(request, response) {
	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	try {
		const pass = await PKPass.from({
			model: path.resolve(
				__dirname,
				`../models/${request.params.modelName}`,
			),
			certificates: {
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
			props: Object.assign(
				{
					voided: request.query.fn === "void",
				},
				{ ...(request.body || request.params || request.query || {}) },
			),
		});

		if (request.query.alt === "true") {
			// After this, pass.props["barcodes"] will have support for all the formats
			pass.setBarcodes("Thank you for using this package <3");

			console.log(
				"Barcodes support is autocompleted:",
				pass.props["barcodes"],
			);
		} else {
			// After this, pass.props["barcodes"] will have support for just two of three
			// of the passed format (the valid ones);

			pass.setBarcodes(
				{
					message: "Thank you for using this package <3",
					format: "PKBarcodeFormatCode128",
				},
				{
					message: "Thank you for using this package <3",
					format: "PKBarcodeFormatPDF417",
				},
				{
					message: "Thank you for using this package <3",
					// @ts-expect-error
					format: "PKBarcodeFormatMock44617",
				},
			);
		}

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
