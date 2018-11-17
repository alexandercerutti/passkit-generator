/**
 * .void() and .expiration() methods example
 * To check if a ticket is void, look at the barcode;
 * If it is grayed, the ticket is voided. May not be showed on macOS.
 *
 * To check if a ticket has an expiration date, you'll
 * have to wait two minutes.
 */

const app = require("./webserver");
const { Pass } = require("..");

app.all(function manageRequest(request, response) {
	let passName = request.params.modelName + "_" + (new Date()).toISOString().split('T')[0].replace(/-/ig, "");

	let pass = new Pass({
		model: `./models/${request.params.modelName}`,
		certificates: {
			wwdr: "../certificates/WWDR.pem",
			signerCert: "../certificates/signerCert.pem",
			signerKey: {
				keyFile: "../certificates/signerKey.pem",
				passphrase: "123456"
			}
		},
		overrides: request.body || request.params || request.query,
	});

	pass.load("https://s.gravatar.com/avatar/83cd11399b7ea79977bc302f3931ee52?size=32&default=retro", "icon.png");
	pass.load("https://s.gravatar.com/avatar/83cd11399b7ea79977bc302f3931ee52?size=64&default=retro", "icon@2x.png");

	// This to import them directly in the localization folder
	/*
		pass.load("https://s.gravatar.com/avatar/83cd11399b7ea79977bc302f3931ee52?size=32&default=retro", "en.lproj/icon.png");
		pass.load("https://s.gravatar.com/avatar/83cd11399b7ea79977bc302f3931ee52?size=64&default=retro", "en.lproj/icon@2x.png");

		pass.localize("en", {
			"EVENT": "Event",
			"LOCATION": "Location"
		});
	*/

	pass.generate().then(function (stream) {
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
