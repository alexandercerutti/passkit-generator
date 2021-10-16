/**
 * .localize() methods example
 * To see all the included languages, you have to unzip the
 * .pkpass file and check for .lproj folders
 */

import app from "./webserver";
import path from "path";
import { PKPass } from "passkit-generator";
/** Symbols are exported just for tests and examples. Replicate only if really needed. */
import { localizationSymbol } from "passkit-generator/lib/PKPass";

app.all(async function manageRequest(request, response) {
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
			request.body || request.params || request.query,
		);

		/**
		 * For each language you include, an .lproj folder in pass bundle
		 * is created or included. You may not want to add translations
		 * but only images for a specific language. So you create manually
		 * an .lproj folder in your pass model then add the language here
		 * below. If no translations does not get added, the folder is
		 * included or created but without pass.strings file.
		 *
		 *
		 * In this example, English does not have an .lproj folder yet and
		 * doesn't have nor receive translations.
		 *
		 * Text placeholders may not be showed for the english language
		 * (e.g. "Event" and "Location" as literal) and another language may be used instead
		 */

		pass.localize("en");

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

		console.log(
			"Added languages",
			Object.keys(pass[localizationSymbol]).join(", "),
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
