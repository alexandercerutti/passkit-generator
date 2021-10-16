/**
 * .expiration() method and voided prop example
 * To check if a ticket is void, look at the barcode;
 * If it is grayed, the ticket is voided. May not be showed on macOS.
 *
 * To check if a ticket has an expiration date, you'll
 * have to wait two minutes.
 */

import app from "./webserver";
import path from "path";
import { PKPass } from "passkit-generator";

app.all(async function manageRequest(request, response) {
	if (!request.query.fn) {
		response.send(
			"<a href='?fn=void'>Generate a voided pass.</a><br><a href='?fn=expiration'>Generate a pass with expiration date</a>",
		);
		return;
	}

	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	try {
		const pass = await PKPass.from(
			{
				model: path.resolve(
					__dirname,
					`../models/${request.params.modelName}`,
				),
				certificates: {
					wwdr: path.resolve(
						__dirname,
						"../../certificates/WWDR.pem",
					),
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
			},
			Object.assign(
				{
					voided: request.query.fn === "void",
				},
				{ ...(request.body || request.params || request.query || {}) },
			),
		);

		if (request.query.fn === "expiration") {
			// 2 minutes later...
			const d = new Date();
			d.setMinutes(d.getMinutes() + 2);

			// setting the expiration
			pass.setExpirationDate(d);
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
