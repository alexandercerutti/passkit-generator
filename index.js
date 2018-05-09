const os = require("os");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");
const archiver = require("archiver");
const express = require("express");
const async = require("async");

const _configuration = Object.freeze(require("./config.json"));

const instance = express();
const supportedTypesOfPass = /(boardingPass|eventTicket|coupon|generic|storeCard)/i;
const passModelsDir = _configuration.models.dir;
const outputDir = _configuration.output.dir;
const Certificates = _configuration.certificates;

instance.use(express.json());

/**
	Apply a filter to arg0 to remove hidden files names (starting with dot)
	@function removeDotFiles
	@params {[String]} from - list of file names
	@return {[String]}
*/

function removeDotFiles(from) {
	return from.filter(e => e.charAt(0) !== ".");
}

function capitalizeFirst(str) {
	return str[0].toUpperCase()+str.slice(1);
}

function fileStreamToBuffer(path, ...callbacks) {
	let stream = fs.createReadStream(path);
	let bufferArray = [];

	if (!path || typeof path !== "string") {
		throw new Error("fileStreamToBuffer: Argument 0 is not provided or is not a string.");
	}

	if (!callbacks || !callbacks.length) {
		throw new Error("fileStreamToBuffer: Argument 1, at least one function must be provided.");
	}

	stream
		.on("data", chunk => bufferArray.push(chunk))
		.on("end", () => callbacks[0](Buffer.concat(bufferArray)))
		// calling callbacks 0 or 1, based on the condition
		.on("error", (e) => callbacks[Number(callbacks.length > 1)](e));
}

/**
	Checks if the certificate and the key files originated from che .p12 file are available

	@function checkSignatureRequirements
	@returns {Object} Promise
*/

function checkSignatureRequirements() {
	let checkCertificate = new Promise(function(available, notAvailable) {
		fs.access(`${Certificates.dir}/${Certificates.files.certificate}`, (e) => (!!e ? notAvailable : available)() );
	});

	let checkKey = new Promise(function(available, notAvailable) {
		fs.access(`${Certificates.dir}/${Certificates.files.key}`, (e) => (!!e ? notAvailable : available)() );
	});

	return Promise.all([checkCertificate, checkKey]);
}

/**
	Generates a unique UUID
	From Github Gist: https://gist.github.com/jed/982883
*/

function UUIDGen(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,UUIDGen)}

/**
	Generates the cryptografic signature for the manifest file.
	Spawns Openssl process since Node.js has no support for PKCSs.

	@function generateManifestSignature
	@params {String} manifestPath - temp dir path created to keep the manifest file.
	@returns {Object} Promise
*/

function generateManifestSignature(manifestUUID) {
	return new Promise(function(done, rejected) {
		checkSignatureRequirements()
		.then(function() {
			let opensslError = false;
			let opensslBuffer = [];

			let opensslProcess = spawn("openssl", [
				"smime",
				"-binary",
				"-sign",
				"-certfile", path.resolve(Certificates.dir, Certificates.files["wwdr_pem"]),
				"-signer", path.resolve(Certificates.dir, Certificates.files["certificate"]),
				"-inkey", path.resolve(Certificates.dir, Certificates.files["key"]),
				"-in", path.resolve(`${os.tmpdir()}/manifest-${manifestUUID}.json`),
//				"-out", path.resolve("passCreator", "event.pass", "./signature"),
				"-outform", "DER",
				"-passin", `pass:${Certificates.credentials["dev_pem_key"]}`
			]);

			opensslProcess.stdout.on("data", function(data) {
				opensslBuffer.push(data);
			});

			opensslProcess.stderr.on("data", function(data) {
				opensslBuffer.push(data);
				opensslError = true;
			});

			opensslProcess.stdout.on("end", function() {
				if (opensslError) {
					return rejected(Buffer.concat(opensslBuffer));
				}

				return done(Buffer.concat(opensslBuffer));
			});
		})
		.catch(function(e) {
			return rejected(`Cannot fulfill signature requirements.\n${e}`);
		});
	});
}

/**
	Generates a Buffer of JSON file (manifest)
	@function generateManifest
	@params {Object} fromObject - Manifest content
	@params {String} manifestUUID
	@return {Promise} - Promise with the manifest buffer
	@see https://apple.co/2IhJr0Q (PassKit Package Structure)
	@see https://apple.co/2K2aY3v (Passes Are Cryptographically Signed and Compressed)
*/

function generateManifest(fromObject, manifestUUID) {
	return new Promise(function(done, failed) {
		if (!fromObject || typeof fromObject !== "object" && typeof fromObject !== "string") {
			return failed("generateManifest: Argument 0 is required and must be of an object or a string (source object)");
		}

		if (!manifestUUID || typeof manifestUUID !== "string") {
			return failed("generateManifest: Argument 1 is required and must be a string (unique uuid).");
		}

		const source = typeof fromObject === "object" ? JSON.stringify(fromObject) : fromObject;
		let manifestWS = fs.createWriteStream(`${os.tmpdir()}/manifest-${manifestUUID}.json`);

		manifestWS.write(source);
		manifestWS.end();

		return done(Buffer.from(source));
	});
}

function queryToOptions(query) {
	// Some options are not supported since should be included inside the model
	// Replace null with handlers to check the correctness of the values if needed.
	// Handlers should contain check
	const supportedOptions = {
		serialNumber: null,
		userInfo: null,
		expirationDate: null,
		locations: null,
		authenticationToken: null,
		barcode: null
	};

	let options = {};

	Object.keys(supportedOptions).forEach(function(key) {
		if (!!query[key]) {
			if (!supportedOptions[key] || typeof supportedOptions[key] !== "function" || typeof supportedOptions[key] === "function" && supportedOptions[key](query[key])) {
				options[key] = query[key];
			}
		}
	});

	return options;
}

function editPassStructure(object, passBuffer) {

	if (!object) {
		return Promise.resolve(passBuffer);
	}

	return new Promise(function(done, reject) {
		try {
			let passFile = JSON.parse(passBuffer.toString("utf8"));

			for (prop in object) {
				passFile[prop] = object[prop];
			}

			return done(Buffer.from(JSON.stringify(passFile)));
		} catch(e) {
			return reject(e);
		}
	});
}


function RequestHandler(request, response) {
	if (!supportedTypesOfPass.test(request.params.type)) {
		// 😊
		response.set("Content-Type", "application/json");
		response.status(418).send({ ecode: 418, status: false, message: `Model unsupported. Refer to https://apple.co/2KKcCrB for supported pass models.`});
		return;
	}

	fs.readdir(`${passModelsDir}/${request.params.type}.pass`, function (err, files) {
		/* Invalid path for passModelsDir */
		if (err) {
			// 😊
			response.set("Content-Type", "application/json");
			response.status(418).send({ ecode: 418, status: false, message: `Model not available for request type [${request.params.type}]. Provide a folder with specified name and .pass extension.`});
			return;
		}

		let list = removeDotFiles(files);

		if (!list.length) {
			// 😊
			response.set("Content-Type", "application/json");
			response.status(418).send({ ecode: 418, status: false, message: `Model for type [${request.params.type}] has no contents. Refer to https://apple.co/2IhJr0Q`});
			return;
		}

		if (!list.includes("pass.json")) {
			// 😊
			response.set("Content-Type", "application/json");
			response.status(418).send({ ecode: 418, status: false, message: "I'm a teapot. How am I supposed to serve you pass without pass.json in the chosen model as tea without water?" });
			return;
		}

		let options = (request.method === "POST" ? request.body : (request.method === "GET" ? request.params : {}));
		fileStreamToBuffer(`${passModelsDir}/${request.params.type}.pass/pass.json`, function _returnBuffer(bufferResult) {
			editPassStructure(queryToOptions(options), bufferResult).then(function _afterJSONParse(passFileBuffer) {
				// Manifest dictionary
				let manifestRaw = {};
				let archive = archiver("zip");

				archive.append(passFileBuffer, { name: "pass.json" });
				manifestRaw["pass.json"] = crypto.createHash("sha1").update(passFileBuffer).digest("hex").trim();

				async.each(list, function getHashAndArchive(file, callback) {
					if (/(manifest|signature|pass)/ig.test(file)) {
						// skipping files
						return callback();
					}

					// adding the files to the zip - i'm not using .directory method because it adds also hidden files like .DS_Store on macOS
					archive.file(`${passModelsDir}/${request.params.type}.pass/${file}`, { name: file });

					let hashFlow = crypto.createHash("sha1");

					fs.createReadStream(`${passModelsDir}/${request.params.type}.pass/${file}`)
					.on("data", function(data) {
						hashFlow.update(data);
					})
					.on("error", function(e) {
						return callback(e);
					})
					.on("end", function() {
						manifestRaw[file] = hashFlow.digest("hex").trim();
						return callback();
					});
				}, function end(error) {
					if (error) {
						throw new Error(`Unable to compile manifest. ${error}`);
					}

					let uuid = UUIDGen();

					generateManifest(manifestRaw, uuid)
					.then(function(manifestBuffer) {

						archive.append(manifestBuffer, { name: "manifest.json" });

						generateManifestSignature(uuid)
						.then(function(signatureBuffer) {

							if (!fs.existsSync("output")) {
								fs.mkdirSync("output");
							}

							archive.append(signatureBuffer, { name: "signature" });
							let outputWS = fs.createWriteStream(`${outputDir}/${request.params.type}.pkpass`);

							archive.pipe(outputWS);
							archive.finalize();

							outputWS.on("close", function() {
								response.status(201).download(`${outputDir}/${request.params.type}.pkpass`, `${request.params.type}.pkpass`, {
									cacheControl: false,
									headers: {
										"Content-type": "application/vnd.apple.pkpass",
										"Content-length": fs.statSync(`${outputDir}/${request.params.type}.pkpass`).size
									}
								});
							});
						})
						.catch(function(buffer) {
							throw buffer.toString();
						});
					})
					.catch(function(error) {
						throw error;
					});
				});

			})
			.catch(function(err) {
				// 😊
				response.set("Content-Type", "application/json");
				response.status(418).send({ ecode: 418, status: false, message: `Got error while parsing pass.json file: ${err}` });
				return;
			});
		}, function _error(e) {
			console.log(e)
		});
	});
}

instance.listen(80, "0.0.0.0", function(request, response) {
	console.log("Listening on 80");
});

instance.get("/", function (request, response) {
	response.send("Hello there!");
});

instance.get("/gen/:type/", RequestHandler);
instance.post("/gen/:type/", RequestHandler);
