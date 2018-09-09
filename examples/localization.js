/**
 * .localize() methods example
 * To see all the included languages, you have to unzip the
 * .pkpass file and check for .lproj folders
 */

const app = require("./webserver");
const { Pass } = require("..");

app.all(function manageRequest(request, response) {

	let passName = request.params.modelName + "_" + (new Date()).toISOString().split('T')[0].replace(/-/ig, "");

	let pass = new Pass({
		model: `./models/${request.params.modelName}`,
		certificates: {
			wwdr: "../certificates/WWDR.pem",
			signerCert: "../certificates/passcertificate.pem",
			signerKey: {
				keyFile: "../certificates/passkey.pem",
				passphrase: "123456"
			}
		},
		overrides: request.body || request.params || request.query,
	});

	// For each language you include, an .lproj folder in pass bundle
	// is created or included. You may not want to add translations but
	// only images for a specific language. So you create manually
	// an .lproj folder in your pass model then add the language here below.
	// If no translations were added, the folder
	// is included or created but without pass.strings file

	// English, does not has an .lproj folder and no translation
	// Text placeholders may not be showed for the english language
	// (e.g. "Event" and "Location" as literal) and another language may be used instead
	pass.localize("en");

	// Italian, already has an .lproj which gets included
	pass.localize("it", {
		"EVENT": "Evento",
		"LOCATION": "Dove"
	});

	// German, doesn't, so is created
	pass.localize("de", {
		"EVENT": "Ereignis",
		"LOCATION": "Ort"
	});

	// This language does not exist but is still added as .lproj folder
	pass.localize("zu", {});

	console.log("Added languages", Object.keys(pass.l10n).join(", "))

	pass.generate().then(function(stream) {
		response.set({
			"Content-type": "application/vnd.apple.pkpass",
			"Content-disposition": `attachment; filename=${passName}.pkpass`
		});

		stream.pipe(response);
	}).catch(err => {

		console.log(err);

		response.set({
			"Content-type": "text/html",
		});

		response.send(err.message);
	});
});
