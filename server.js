const express = require("express");
const path = require("path");
const fs = require("fs");
const Passkit = require("./index");
const Configuration = require("./config.json");

const instance = express();

instance.use(express.json());
instance.listen(80, "0.0.0.0", function(request, response) {
	console.log("Listening on 80");
});

instance.get("/", function (request, response) {
	response.send("Hello there!");
});

function manageRequest(request, response) {
	let passName = (request.query.name ||
					request.body.name ||
					request.params.name ||
					request.query.modelName ||
					request.body.modelName ||
					request.params.modelName) + "_" + (new Date()).toISOString().split('T')[0].replace(/-/ig, "");

	let overrides = Object.keys(request.body).length ? request.body : request.query;

	/* This gets removed since not the right way to populate.
	 *
	 * overrides["primaryFields"] = [{
	 * 	key: "alpha",
	 * 	value: "beto",
	 * 	label: "muhahahah"
	 * }];
	 */

	response.set({
		"Content-type": "application/vnd.apple.pkpass",
		"Content-disposition": `attachment; filename=${passName}.pkpass`
	});

	let pass = new Passkit.Pass({
		model: "./passModels/"+(request.params.modelName || request.query.modelName),
		certificates: {
			wwdr: "./certificates/WWDR.pem",
			signerCert: "./certificates/passcertificate.pem",
			signerKey: {
				keyFile: "./certificates/passkey.pem",
				passphrase: "123456"
			}
		},
		overrides: overrides
	});

	pass.localize("it", {
		"EVENT": "Evento",
		"LOCATION": "Dove"
	});

	pass.localize("en", {
		"EVENT": "Event",
		"LOCATION": "Location"
	})

	// non-existing language code
	pass.localize("ol", {
		"EVENT": "numashat",
		"LOCATION": "abelret"
	});

	//pass.localize("zu", {});

	pass.primaryFields.push({
		key: "Meh",
		value: "AppleParty",
		label: "PARTY"
	}, {
		key: "Meh2",
		value: "AppleParty2",
		label: "PARTY"
	});

	// pass.primaryFields.push([{
	// 	key: "Meh",
	// 	value: "AppleParty",
	// 	label: "PARTY"
	// }, {
	// 	key: "Meh2",
	// 	value: "AppleParty2",
	// 	label: "PARTY"
	// }]);

	pass.secondaryFields.push({
		key: "Something",
		value: "Second row",
		label: "ROW"
	});

	// pass.expiration("05-02-2017");
	// pass.expiration("05-02-2017").void();
	// pass.void();

	pass.generate()
	.then(function(result) {
		if (Configuration.output.dir && Configuration.output.shouldWrite && !fs.accessSync(path.resolve(Configuration.output.dir))) {
			let wstreamOutputPass = fs.createWriteStream(path.resolve(Configuration.output.dir, `${passName}.pkpass`));
		}

		result.pipe(response);
	})
	.catch(function(err) {
		console.log(err);
		// console.log(err.message);

		response.set("Content-Type", "application/json");
		response.status(418).send({
			status: false,
			error: {
				message: err.message
			}
		});
	})
}

instance.get("/gen/:modelName?", manageRequest);
instance.post("/gen/:modelName?", manageRequest);
