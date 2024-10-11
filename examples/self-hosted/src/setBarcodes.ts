/**
 * .barcodes() methods example
 * Here we set the barcode. To see all the results, you can
 * both unzip .pkpass file or check the properties before
 * generating the whole bundle
 *
 * Pass ?alt=true as querystring to test a barcode generate
 * by a string
 */

import { app } from "./webserver";
import { getCertificates } from "./shared";
import { PKPass } from "passkit-generator";
import path from "node:path";

app.route("/barcodes/:modelName").get(async (request, response) => {
	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	const certificates = await getCertificates();

	try {
		const pass = await PKPass.from(
			{
				model: path.resolve(
					__dirname,
					`../../models/${request.params.modelName}`,
				),
				certificates: {
					wwdr: certificates.wwdr,
					signerCert: certificates.signerCert,
					signerKey: certificates.signerKey,
					signerKeyPassphrase: certificates.signerKeyPassphrase,
				},
			},
			request.body || request.params || request.query || {},
		);

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
			);
		}

		if (pass.type === "boardingPass" && !pass.transitType) {
			// Just to not make crash the creation if we use a boardingPass
			pass.transitType = "PKTransitTypeAir";
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
