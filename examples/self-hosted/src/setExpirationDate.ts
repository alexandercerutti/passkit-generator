/**
 * .expiration() method and voided prop example
 * To check if a ticket is void, look at the barcode;
 * If it is grayed, the ticket is voided. May not be showed on macOS.
 *
 * To check if a ticket has an expiration date, you'll
 * have to wait two minutes.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { PKPass } from "passkit-generator";
import { app } from "./webserver.js";
import { getCertificates } from "./shared.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.route("/expirationDate/:modelName").get(async (request, response) => {
	if (!request.query.fn) {
		response.send(
			"<a href='?fn=void'>Generate a voided pass.</a><br><a href='?fn=expiration'>Generate a pass with expiration date</a>",
		);
		return;
	}

	const certificates = await getCertificates();

	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

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
			console.log(
				"EXPIRATION DATE EXPECTED:",
				pass.props["expirationDate"],
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
