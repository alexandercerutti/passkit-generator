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
	if (!request.query.fn) {
		response.send("<a href='?fn=void'>Generate a voided pass.</a><br><a href='?fn=expiration'>Generate a pass with expiration date</a>");
		return;
	}

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

	if (request.query.fn === "void") {
		pass.void();
	} else if (request.query.fn === "expiration") {
		// 2 minutes later...
		let d = new Date();
		d.setMinutes(d.getMinutes()+2);

		// setting the expiration
		pass.expiration(d.toLocaleString());
	}

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
