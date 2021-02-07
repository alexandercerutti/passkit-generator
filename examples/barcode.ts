/**
 * .barcode() and .barcodes() methods example
 * Here we set the barcode. To see all the results, you can
 * both unzip .pkpass file or check the properties before
 * generating the whole bundle
 *
 * Pass ?alt=true as querystring to test a barcode generate
 * by a string
 */

import app from "./webserver";
import { createPass } from "passkit-generator";

app.all(async function manageRequest(request, response) {
	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	try {
		const pass = await createPass({
			model: `./models/${request.params.modelName}`,
			certificates: {
				wwdr: "../certificates/WWDR.pem",
				signerCert: "../certificates/signerCert.pem",
				signerKey: {
					keyFile: "../certificates/signerKey.pem",
					passphrase: "123456",
				},
			},
			overrides: request.body || request.params || request.query,
		});

		if (request.query.alt === true) {
			// After this, pass.props["barcodes"] will have support for all the formats
			// while pass.props["barcode"] will be the first of barcodes.

			pass.barcodes("Thank you for using this package <3");
		} else {
			// After this, pass.props["barcodes"] will have support for just two of three
			// of the passed format (the valid ones);

			pass.barcodes(
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

		// You can change the format chosen for barcode prop support by calling .barcode()
		// or cancel the support by calling empty .barcode
		// like pass.barcode().

		pass.barcode("PKBarcodeFormatPDF417");

		console.log("Barcode property is now:", pass.props["barcode"]);
		console.log(
			"Barcodes support is autocompleted:",
			pass.props["barcodes"],
		);

		const stream = pass.generate();
		response.set({
			"Content-type": "application/vnd.apple.pkpass",
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
