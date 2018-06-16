const fs = require("fs");
const path = require("path");
const forge = require("node-forge");
const archiver = require("archiver");
const async = require("async");
const stream = require("stream");

const supportedTypesOfPass = /(boardingPass|eventTicket|coupon|generic|storeCard)/i;
const Certificates = {
	status: false
};

const Configuration = {
	passModelsDir: null,
	output: {
		shouldWrite: false,
		dir: null,
	}
}

/**
	Apply a filter to arg0 to remove hidden files names (starting with dot)
	@function removeHiddenFiles
	@params {[String]} from - list of file names
	@return {[String]}
*/

function removeHiddenFiles(from) {
	return from.filter(e => e.charAt(0) !== ".");
}

function capitalizeFirst(str) {
	return str[0].toUpperCase()+str.slice(1);
}


// class Pass {
// 	constructor(modelName, options) {
// 		if (!modelName) {
// 			throw new Error("A model is required. Provide in order to continue.");
// 		}

// 		this._model = path.resolve(modelName);
// 		this._compiled = false;
// 		this._l10n = [];
// 	}

// 	_modelExists() {
// 		return !fs.accessSync(this._model);
// 	}

// 	_fetchModel() {
// 		return new Promise((success, reject) => {
// 			fs.readdir(this._model, function(err, files) {
// 				if (err) {
// 					// should not even enter in _fetchModel since the check is made by _modelExists method.
// 					throw new Error("Seems like the previous check, this._modelExists(), failed.");
// 				}

// 				// Removing hidden files and folders
// 				let list = removeHiddenFiles(files).filter(f => !f.includes(".lproj"));

// 				if (!list.length) {
// 					return reject("Model provided matched but unitialized. Refer to https://apple.co/2IhJr0Q to fill the model correctly.");
// 				}

// 				if (!list.includes("pass.json")) {
// 					return reject("I'm a teapot. How am I supposed to serve you pass without pass.json in the chosen model as tea without water?");
// 				}

// 				// Getting only folders
// 				let folderList = files.filter(f => f.includes(".lproj"));

// 				// I may have (and I rathered) used async.concat to achieve this but it returns a list of filenames ordered by folder.
// 				// The problem rises when I have to understand which is the first file of a folder which is not the first one.
// 				// By doing this way, I get an Array of folder contents (which is an array too).

// 				let folderExtractors = folderList.map(f => function(callback) {
// 					let l10nPath = path.join(modelPath, f);

// 					fs.readdir(l10nPath, function(err, list) {
// 						if (err) {
// 							return callback(err, null);
// 						}

// 						let filteredFiles = removeHiddenFiles(list);

// 						if (!filteredFiles.length) {
// 							return callback(null, []);
// 						}

// 						this._l10n.push(f.replace(".lproj", ""));

// 						return callback(null, filteredFiles);
// 					});
// 				});

// 				async.parallel(folderExtractors, function(err, listByFolder) {
// 					if (err) {
// 						return reject(err);
// 					}

// 					//listByFolder.forEach((folder, index) => list.push(...folder.map(f => path.join(folderList[index], f))));

// 					list.push(...listByFolder.reduce(function(accumulator, folder, index) {
// 						accumulator.push(...folder.map(f => path.join(folderList[index], f)));
// 						return accumulator;
// 					}, []));

// 					return success(listByFolder)
// 				});
// 			});
// 		});
// 	}

// 	_patch(patches) {
// 		if (!patches) {
// 			return Promise.resolve();
// 		}

// 		return new Promise(function(done, reject) {
// 			try {
// 				let passFile = JSON.parse(this.content.toString("utf8"));

// 				for (prop in patches) {
// 					passFile[prop] = patches[prop];
// 				}

// 				this.content = Buffer.from(passFile);
// 				return done();
// 			} catch(e) {
// 				return reject(e);
// 			}
// 		});
// 	}

// 	_fetchBody() {
// 		return new Promise((success, reject) => {
// 			fs.readFile(path.resolve(Configuration.passModelsDir, `${this._model}.pass`, "pass.json"), {}, function _parsePassJSONBuffer(err, passStructBuffer) {
// 				if (err) {
// 					return reject("Unable to fetch pass body buffer.");
// 				}

// 				this.content = passStructBuffer;
// 				return success(null);

// 				// editPassStructure(filterPassOptions(options.overrides), passStructBuffer)
// 				// .then(function _afterJSONParse(passFileBuffer) {
// 				// 	manifest["pass.json"] = forge.md.sha1.create().update(passFileBuffer.toString("binary")).digest().toHex();
// 				// 	archive.append(passFileBuffer, { name: "pass.json" });

// 				// 	return passCallback(null);
// 				// })
// 				// .catch(function(err) {
// 				// 	return reject({
// 				// 		status: false,
// 				// 		error: {
// 				// 			message: `pass.json Buffer is not a valid buffer. Unable to continue.\n${err}`,
// 				// 			ecode: 418
// 				// 		}
// 				// 	});
// 				// });
// 			});
// 		});
// 	}

// 	generate() {
// 		if (this._compiled) {
// 			throw new Error("Cannot generate the pass again.");
// 		}

// 		this._compiled = !this._compiled;

// 		return new Promise((success, reject) => {
// 			if (this._modelExists()) {
// 				this._fetchModel().then((list) => {

// 				});
// 			}
// 		});
// 	}
// }



class Pass {
	constructor(options) {
		this.options = options
	}

	/**
		Compiles the pass

		@method generate
		@return {Promise} - A JSON structure containing the error or the stream of the generated pass.
	*/

	generate() {
		return new Promise((success, reject) => {
			if (!this.options.modelName || typeof this.options.modelName !== "string") {
				return reject({
					status: false,
					error: {
						message: "A string model name must be provided in order to continue.",
						ecode: 418
					}
				});
			}

			let modelPath = path.resolve(Configuration.passModelsDir, `${this.options.modelName}.pass`);

			fs.readdir(modelPath, (err, files) => {
				if (err) {
					return reject({
						status: false,
						error: {
							message: "Provided model name doesn't match with any model in the folder.",
							ecode: 418
						}
					});
				}

				// Removing hidden files and folders
				let list = removeHiddenFiles(files).filter(f => !f.includes(".lproj"));

				if (!list.length) {
					return reject({
						status: false,
						error: {
							message: "Model provided matched but unitialized. Refer to https://apple.co/2IhJr0Q to fill the model correctly.",
							ecode: 418
						}
					});
				}

				if (!list.includes("pass.json")) {
					return reject({
						status: false,
						error: {
							message: "I'm a teapot. How am I supposed to serve you pass without pass.json in the chosen model as tea without water?",
							ecode: 418
						}
					});
				}

				// Getting only folders
				let folderList = files.filter(f => f.includes(".lproj"));

				// I may have (and I rathered) used async.concat to achieve this but it returns a list of filenames ordered by folder.
				// The problem rise when I have to understand which is the first file of a folder which is not the first one.
				// By doing this way, I get an Array containing an array of filenames for each folder.

				let folderExtractors = folderList.map(f => function(callback) {
					let l10nPath = path.join(modelPath, f);

					fs.readdir(l10nPath, function(err, list) {
						if (err) {
							return callback(err, null);
						}

						let filteredFiles = removeHiddenFiles(list);
						return callback(null, filteredFiles);
					});
				});

				async.parallel(folderExtractors, (err, listByFolder) => {
					listByFolder.forEach((folder, index) => list.push(...folder.map(f => path.join(folderList[index], f))));

					let manifest = {};
					let archive = archiver("zip");

					// Using async.parallel since the final part must be executed only when both are completed.
					// Otherwise would had to put everything in editPassStructure's Promise .then().
					async.parallel([
						(passCallback) => {
							fs.readFile(path.resolve(Configuration.passModelsDir, `${this.options.modelName}.pass`, "pass.json"), {}, (err, passStructBuffer) => {
								editPassStructure(filterPassOptions(this.options.overrides), passStructBuffer)
								.then(function _afterJSONParse(passFileBuffer) {
									manifest["pass.json"] = forge.md.sha1.create().update(passFileBuffer.toString("binary")).digest().toHex();
									archive.append(passFileBuffer, { name: "pass.json" });

									return passCallback(null);
								})
								.catch(function(err) {
									return reject({
										status: false,
										error: {
											message: `pass.json Buffer is not a valid buffer. Unable to continue.\n${err}`,
											ecode: 418
										}
									});
								});
							});
						},

						(bundleCallback) => {
							async.each(list, (file, callback) => {
								if (/(manifest|signature|pass)/ig.test(file)) {
									// skipping files
									return callback();
								}

								// adding the files to the zip - i'm not using .directory method because it adds also hidden files like .DS_Store on macOS
								archive.file(path.resolve(Configuration.passModelsDir, `${this.options.modelName}.pass`, file), { name: file });

								let hashFlow = forge.md.sha1.create();

								fs.createReadStream(path.resolve(Configuration.passModelsDir, `${this.options.modelName}.pass`, file))
								.on("data", function(data) {
									hashFlow.update(data.toString("binary"));
								})
								.on("error", function(e) {
									return callback(e);
								})
								.on("end", function() {
									manifest[file] = hashFlow.digest().toHex().trim();
									return callback();
								});
							}, function end(error) {
								if (error) {
									return reject({
										status: false,
										error: {
											message: `Unable to compile manifest. ${error}`,
											ecode: 418
										}
									});
								}

								return bundleCallback(null);
							});
						}
					], () => {
						archive.append(JSON.stringify(manifest), { name: "manifest.json" });

						let signatureBuffer = this._sign(manifest);
						archive.append(signatureBuffer, { name: "signature" });

						let passStream = new stream.PassThrough();
						archive.pipe(passStream);
						archive.finalize().then(function() {
							return success({
								status: true,
								content: passStream,
							});
						});
					});
				});
			});
		});
	}

	/**
		Generates the PKCS #7 cryptografic signature for the manifest file.

		@method _sign
		@params {String|Object} manifest - Manifest content.
		@returns {Object} Promise
	*/

	_sign(manifest) {
		let signature = forge.pkcs7.createSignedData();

		if (typeof manifest === "object") {
			signature.content = forge.util.createBuffer(JSON.stringify(manifest), "utf8")
		} else if (typeof manifest === "string") {
			signature.content = manifest;
		} else {
			throw new Error(`Manifest content must be a string or an object. Unable to accept manifest of type ${typeof manifest}`);
		}

		signature.addCertificate(Certificates.wwdr);
		signature.addCertificate(Certificates.signerCert);

		signature.addSigner({
			key: Certificates.signerKey,
			certificate: Certificates.signerCert,
			digestAlgorithm: forge.pki.oids.sha1,
			authenticatedAttributes: [{
				type: forge.pki.oids.contentType,
				value: forge.pki.oids.data
			}, {
				type: forge.pki.oids.messageDigest,
			}, {
				// the value is autogenerated
				type: forge.pki.oids.signingTime,
			}]
		});

		signature.sign();

		/*
		 * Signing creates in contentInfo a JSON object nested BER/TLV (X.690 standard) structure.
		 * Each object represents a component of ASN.1 (Abstract Syntax Notation)
		 * For a more complete reference, refer to: https://en.wikipedia.org/wiki/X.690#BER_encoding
		 *
		 * signature.contentInfo.type => SEQUENCE OF (16)
		 * signature.contentInfo.value[0].type => OBJECT IDENTIFIER (6)
		 * signature.contantInfo.value[1].type => END OF CONTENT (EOC - 0)
		 *
		 * EOC are only present only in constructed indefinite-length methods
		 * Since `signature.contentInfo.value[1].value` contains an object whose value contains the content we passed,
		 * we have to pop the whole object away to avoid signature content invalidation.
		 *
		 */
		signature.contentInfo.value.pop();

		// Converting the JSON Structure into a DER (which is a subset of BER), ASN.1 valid structure
		// Returning the buffer of the signature

		return Buffer.from(forge.asn1.toDer(signature.toAsn1()).getBytes(), 'binary');
	}
}


function loadConfiguration(setup) {
	let reqFilesKeys = ["wwdr", "signerCert", "signerKey"];

	// Node-Forge also accepts .cer certificates
	if (!setup.certificates.dir || fs.accessSync(path.resolve(setup.certificates.dir)) !== undefined) {
		throw new Error("Unable to load certificates directory. Check its existence or the permissions.");
	}

	if (!setup.certificates.files) {
		throw new Error("Expected key 'files' in configuration file but not found.");
	}

	if (!setup.certificates.files.wwdr) {
		throw new Error("Expected file path or content for key certificates.files.wwdr. Please provide a valid certificate from https://apple.co/2sc2pvv");
	}

	if (!setup.certificates.files.signerCert) {
		throw new Error("Expected file path or content for key certificates.files.signerCert. Please provide a valid signer certificate.")
	}

	if (!setup.certificates.files.signerKey || !setup.certificates.credentials.privateKeySecret) {
		throw new Error("Expected file path or content for key certificates.files.signerKey with an associated password at certificates.credentials.privateKeySecret but not found.")
	}

	let certPaths = reqFilesKeys.map(e => path.resolve(setup.certificates.dir, setup.certificates.files[e]));

	return new Promise(function(success, reject) {
		let docStruct = {};

		async.concat(certPaths, fs.readFile, function(err, contents) {
			if (err) {
				return reject(err);
			}

			return success(
				contents.map(function(file, index) {
					if (file.includes("PRIVATE KEY")) {
						return forge.pki.decryptRsaPrivateKey(
							file,
							setup.certificates.credentials.privateKeySecret
						);
					} else if (file.includes("CERTIFICATE")) {
						return forge.pki.certificateFromPem(file);
					} else {
						throw new Error("File not allowed in configuration. Only .pems files containing certificates and private keys are allowed");
					}
				})
			)
		});
	});
}

/**
	Filters the options received in the query from http request into supported options
	by Apple and this application, based on the functions that can be provided to keys
	in supportedOptions.

	You can create your own function to check if keys in query meet your requirements.
	They accept the value provided in the related query key as unique parameter.
	Make them return a boolean value, true if the requirements are met, false otherwise.

	Example:

	barcode: function _checkBarcode() {
		if ( type of barcode not supported ) {
			return false;
		}

		if ( barcode value doesn't meet your requirements )
			return false;
		}

		return true;
	}

	Please note that some options are not supported since should be included inside the
	models you provide in "passModels" directory.

	@function filterPassOptions
	@params {Object} query - raw informations to be edited in the pass.json file
							from HTTP Request Params or Body
	@returns {Object} - filtered options based on above criterias.
*/

function filterPassOptions(query) {
	const supportedOptions = {
		"serialNumber": null,
		"userInfo": null,
		"expirationDate": null,
		"locations": null,
		"authenticationToken": null,
		"barcode": null
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

/**
	Edits the buffer of pass.json based on the passed options.

	@function editPassStructure
	@params {Object} options - options resulting from the filtering made by filterPassOptions function
	@params {Buffer} passBuffer - Buffer of the contents of pass.json
	@returns {Promise} - Edited pass.json buffer or Object containing error.
*/

function editPassStructure(options, passBuffer) {
	if (!options) {
		return Promise.resolve(passBuffer);
	}

	return new Promise(function(done, reject) {
		try {
			let passFile = JSON.parse(passBuffer.toString("utf8"));

			for (prop in options) {
				passFile[prop] = options[prop];
			}

			return done(Buffer.from(JSON.stringify(passFile)));
		} catch(e) {
			return reject(e);
		}
	});
}

function init(configPath) {
	if (Certificates.status) {
		throw new Error("Initialization must be triggered only once.");
	}

	if (!configPath || typeof configPath !== "object" || typeof configPath === "object" && !Object.keys(configPath).length) {
		throw new Error(`Cannot initialize PassKit module. Param 0 expects a non-empty configuration object.`);
	}

	let queue = [
		new Promise(function(success, reject) {
			fs.access(path.resolve(configPath.models.dir), function(err) {
				if (err) {
					return reject("A valid pass model directory is required. Please provide one in the configuration file under voice 'models.dir'.")
				}

				return success(true);
			});
		}),
		loadConfiguration(configPath)
	];

	Promise.all(queue)
	.then(function(results) {
		let certs = results[1];

		if (results[0]) {
			Configuration.passModelsDir = configPath.models.dir;
		}

		Certificates.wwdr = certs[0];
		Certificates.signerCert = certs[1];
		Certificates.signerKey = certs[2];
		Certificates.status = true;
	})
	.catch(function(error) {
		throw new Error(error);
	});
}

module.exports = { init, Pass };
