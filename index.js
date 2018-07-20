const fs = require("fs");
const path = require("path");
const forge = require("node-forge");
const archiver = require("archiver");
const async = require("async");
const stream = require("stream");
const settingSchema = require("./schema.js");

/**
	Apply a filter to arg0 to remove hidden files names (starting with dot)
	@function removeHiddenFiles
	@params {[String]} from - list of file names
	@return {[String]}
*/

function removeHiddenFiles(from) {
	return from.filter(e => e.charAt(0) !== ".");
}

class Pass {
	constructor(options) {
		this.overrides = options.overrides || {};
		this.Certificates = {};
		this.handlers = {};
		this.modelDirectory = null;
		this._parseSettings(options)
;//			.then(() => console.log("WAT IS", this));
		this.passTypes = /^(boardingPass|eventTicket|coupon|generic|storeCard)$/;
	}

	/**
		Compiles the pass

		@method generate
		@return {Promise} - A JSON structure containing the error or the stream of the generated pass.
	*/

	generate() {
		return new Promise((success, reject) => {
			if (!this.modelName || typeof this.modelName !== "string") {
				return reject({
					status: false,
					error: {
						message: "A string model name must be provided in order to continue.",
						ecode: 418
					}
				});
			}

			let computedModelPath = path.resolve(this.modelDirectory, `${this.modelName}.pass`);

			fs.readdir(computedModelPath, (err, files) => {
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
				// The problem rises when I have to understand which is the first file of a folder which is not the first one.
				// By doing this way, I get an Array containing an array of filenames for each folder.

				let folderExtractors = folderList.map(f => function(callback) {
					let l10nPath = path.join(computedModelPath, f);

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
						passCallback => {
							fs.readFile(path.resolve(this.modelDirectory, `${this.modelName}.pass`, "pass.json"), {}, (err, passStructBuffer) => {
								if (!this._validateType(passStructBuffer)) {
									return passCallback({
										status: false,
										error: {
											message: `Unable to validate pass type or pass file is not a valid buffer. Refer to https://apple.co/2Nvshvn to use a valid type.`
										}
									});
								}

								this._patch(this._filterOptions(this.overrides), passStructBuffer)
									.then(function _afterJSONParse(passFileBuffer) {
										manifest["pass.json"] = forge.md.sha1.create().update(passFileBuffer.toString("binary")).digest().toHex();
										archive.append(passFileBuffer, { name: "pass.json" });

										// no errors happened
										return passCallback(null);
									})
									.catch(function(err) {
										return passCallback({
											status: false,
											error: {
												message: `Unable to read pass.json as buffer @ ${computedModelPath}. Unable to continue.\n${err}`,
												ecode: 418
											}
										});
									});
							});
						},

						bundleCallback => {
							async.each(list, (file, callback) => {
								if (/(manifest|signature|pass)/ig.test(file)) {
									// skipping files
									return callback();
								}

								// adding the files to the zip - i'm not using .directory method because it adds also hidden files like .DS_Store on macOS
								archive.file(path.resolve(this.modelDirectory, `${this.modelName}.pass`, file), { name: file });

								let hashFlow = forge.md.sha1.create();

								fs.createReadStream(path.resolve(this.modelDirectory, `${this.modelName}.pass`, file))
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
					], (error) => {
						if (error) {
							return reject(error);
						}

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

	_validateType(passBuffer) {
		try {
			let passFile = JSON.parse(passBuffer.toString("utf8"));

			return Object.keys(passFile).some(key => this.passTypes.test(key));
		} catch (e) {
			return false;
		}
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
			signature.content = forge.util.createBuffer(JSON.stringify(manifest), "utf8");
		} else if (typeof manifest === "string") {
			signature.content = manifest;
		} else {
			throw new Error(`Manifest content must be a string or an object. Unable to accept manifest of type ${typeof manifest}`);
		}

		signature.addCertificate(this.Certificates.wwdr);
		signature.addCertificate(this.Certificates.signerCert);

		signature.addSigner({
			key: this.Certificates.signerKey,
			certificate: this.Certificates.signerCert,
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

		return Buffer.from(forge.asn1.toDer(signature.toAsn1()).getBytes(), "binary");
	}

	/**
		Edits the buffer of pass.json based on the passed options.

		@method _patch
		@params {Object} options - options resulting from the filtering made by filterPassOptions function
		@params {Buffer} passBuffer - Buffer of the contents of pass.json
		@returns {Promise} - Edited pass.json buffer or Object containing error.
	*/

	_patch(options, passBuffer) {
		if (!options) {
			return Promise.resolve(passBuffer);
		}

		return new Promise(function(done, reject) {
			try {
				let passFile = JSON.parse(passBuffer.toString("utf8"));

				for (let prop in options) {
					passFile[prop] = options[prop];
				}

				return done(Buffer.from(JSON.stringify(passFile)));
			} catch(e) {
				return reject(e);
			}
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

		@method _filterOptions
		@params {Object} query - raw informations to be edited in the pass.json file
								from HTTP Request Params or Body
		@returns {Object} - filtered options based on above criterias.
	*/

	_filterOptions(query) {
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
			if (query[key]) {
				if (!supportedOptions[key] || typeof supportedOptions[key] !== "function" || typeof supportedOptions[key] === "function" && supportedOptions[key](query[key])) {
					options[key] = query[key];
				}
			}
		});

		return options;
	}

	/**
		Validates the contents of the passed options and assigns the contents to the right properties
	*/

	_parseSettings(options) {
		return new Promise((success, reject) => {
			// var contents = {
			// 	"certificates": {
			// 		"wwdr": "aaaa",
			// 		"signer": {
			// 			"cert": "aaaaa",
			// 			"key": "aaaa"
			// 		}
			// 	},
			// 	"handlers": {
			// 		"barcode": function() { console.log("aaa"); }
			// 	}
			// };

			if (!settingSchema.validate(options)) {
				throw new Error("The options passed to Pass constructor does not meet the requirements. Refer to the documentation to compile them correctly.");
			}

			this.modelDirectory = path.resolve(__dirname, options.modelDir);
			this.Certificates.dir = options.certificates.dir;
			this.modelName = options.modelName;

			let certPaths = Object.keys(options.certificates)
				.filter(v => v !== "dir")
				.map((val) =>
					path.resolve(
						this.Certificates.dir,
						typeof options.certificates[val] !== "object" ? options.certificates[val] : options.certificates[val]["keyFile"]
					)
				);

			async.parallel([
				(function __certificatesParser(callback) {
					async.concat(certPaths, fs.readFile, (err, contents) => {
						if (err) {
							return reject(err);
						}

						contents.forEach(file => {
							let pem = this.__parsePEM(file, options.certificates.signerKey.passphrase);
							if (!pem.key || !pem.value) {
								throw new Error("Invalid certificates got loaded. Please provide WWDR certificates and developer signer certificate and key (with passphrase).");
							}

							this.Certificates[pem.key] = pem.value;
						});

						return callback();
					});
				}).bind(this),

				(function __handlersAssign(callback) {
					this.handlers = options.handlers || {};
					return callback();
				}).bind(this)
			], success);
		});
	}

	__parsePEM(element, passphrase) {
		if (element.includes("PRIVATE KEY") && !!passphrase) {
			return {
				key: "signerKey",
				value: forge.pki.decryptRsaPrivateKey(element, String(passphrase))
			};
		} else if (element.includes("CERTIFICATE")) {
			// PEM-exported certificates with keys are in PKCS#12 format, hence they are composed of bags.
			return {
				key: element.includes("Bag Attributes") ? "signerCert" : "wwdr",
				value: forge.pki.certificateFromPem(element)
			};
		} else {
			return { key: null, value: null };
		}
	}
}

module.exports = { Pass };
