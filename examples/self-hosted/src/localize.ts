/**
 * .localize() methods example
 * To see all the included languages, you have to unzip the
 * .pkpass file and check for .lproj folders
 */

import { app } from "./webserver";
import { getCertificates } from "./shared";
import path from "node:path";
import { PKPass } from "passkit-generator";

app.route("/localize/:modelName").get(async (request, response) => {
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
			request.body || request.params || request.query,
		);

		// Italian, already has an .lproj which gets included...
		pass.localize("it", {
			EVENT: "Evento",
			LOCATION: "Dove",
		});

		// ...while German doesn't, so it gets created
		pass.localize("de", {
			EVENT: "Ereignis",
			LOCATION: "Ort",
		});

		// This language does not exist but is still added as .lproj folder
		pass.localize("zu", {});

		console.log("Added languages", Object.keys(pass.languages).join(", "));

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
