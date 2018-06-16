const express = require("express");
const path = require("path");
const fs = require("fs");
const Passkit = require("./index");
const Configuration = require("./config.json");

Passkit.init(Configuration);

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

	response.set({
		"Content-type": "application/vnd.apple.pkpass",
		"Content-disposition": `attachment; filename=${passName}.pkpass`
	});

	let pass = new Passkit.Pass({
		modelName: request.params.modelName || request.query.modelName,
		overrides: {}
	});

	pass.generate()
	.then(function(result) {
		result.content.pipe(response);

		if (Configuration.output.dir && Configuration.output.shouldWrite && !fs.accessSync(path.resolve(Configuration.output.dir))) {
			let wstreamOutputPass = fs.createWriteStream(path.resolve(Configuration.output.dir, `${passName}.pkpass`));
			result.content.pipe(wstreamOutputPass);
		}
	})
	.catch(function(err) {
		console.log(err);

		response.set("Content-Type", "application/json");
		response.status(418).send(err);
	})
}

instance.get("/gen/:modelName?", manageRequest);
instance.post("/gen/:modelName?", manageRequest);
