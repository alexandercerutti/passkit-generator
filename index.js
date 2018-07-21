const fs = require("fs");
const path = require("path");
const forge = require("node-forge");
const archiver = require("archiver");
const async = require("async");
const stream = require("stream");
const settingSchema = require("./schema.js");

/**
	Apply a filter to arg0 to remove hidden files names (starting with dot)
	@function removeHidden
	@params {[String]} from - list of file names
	@return {[String]}
*/

function removeHidden(from) {
	return from.filter(e => e.charAt(0) !== ".");
}

class Pass {
	constructor(options) {
		this.passTypes = ["boardingPass", "eventTicket", "coupon", "generic", "storeCard"];
		this.overrides = options.overrides || {};
		this.Certificates = {};
		this.handlers = {};
		this.model = {
			name: null,
			dir: null,
			computed: null,
		};

		this._parseSettings(options)
			.then(() => {
				this._checkReqs()
					.catch(e => { throw new Error(e) });
			});
	}

	/**
		Compiles the pass

		@method generate
		@return {Promise} - A JSON structure containing the error or the stream of the generated pass.
	*/

	generate() {
		return new Promise((success, reject) => {
			fs.readdir(this.model.computed, (err, files) => {
				// list without dynamic components like manifest, signature or pass files (will be added later in the flow) and hidden files.
				let noDynList = removeHidden(files).filter(f => !/(manifest|signature|pass)/i.test(f));

				// list without localization files (they will be added later in the flow)
				let bundleList = noDynList.filter(f => !f.includes(".lproj"));

				const L10N = {
					// localization folders only
					list: noDynList.filter(f => f.includes(".lproj"))
				};

				/*
				 * I may have (and I rathered) used async.concat to achieve this but it returns a list of filenames ordered by folder.
				 * The problem rises when I have to understand which is the first file of a folder which is not the first one.
				 *
				 * Therefore, I generate a function for each localization (L10N) folder inside the model.
				 * Each function will read at the same time the content of the folder and return an array of the filenames inside that L10N folder.
				 */

				L10N.extractors = L10N.list.map(f => ((callback) => {
					let l10nPath = path.join(this.model.computed, f);

					fs.readdir(l10nPath, function(err, list) {
						if (err) {
							return callback(err, null);
						}

						let filteredFiles = removeHidden(list);
						return callback(null, filteredFiles);
					});
				}));

				async.parallel(L10N.extractors, (err, listByFolder) => {
					listByFolder.forEach((folder, index) => bundleList.push(...folder.map(f => path.join(L10N.list[index], f))));

					let manifest = {};
					let archive = archiver("zip");

					// Using async.parallel since the final part must be executed only when both are completed.
					// Otherwise would had to put everything in editPassStructure's Promise .then().
					async.parallel([
						passCallback => {
							fs.readFile(path.resolve(this.model.computed, "pass.json"), {}, (err, passStructBuffer) => {
								if (err) {
									// Flow should never enter in there since pass.json existence-check is already done above.
									return passCallback({
										status: false,
										error: {
											message: `Unable to read pass.json file @ ${this.model.computed}`
										}
									});
								}

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
												message: `Unable to read pass.json as buffer @ ${this.model.computed}. Unable to continue.\n${err}`,
												ecode: 418
											}
										});
									});
							});
						},

						bundleCallback => {
							let pathList = bundleList.map(f => path.resolve(this.model.computed, f));

							async.concat(pathList, fs.readFile, (err, modelBuffers) => {
								// I want to get an object containing each buffer associated with its own file name
								let modelFiles = Object.assign({}, ...modelBuffers.map((buf, index) => ({ [bundleList[index]]: buf })));

								async.eachOf(modelFiles, (fileBuffer, bufferKey, callback) => {
									let hashFlow = forge.md.sha1.create();
									hashFlow.update(fileBuffer.toString("binary"));

									manifest[bufferKey] = hashFlow.digest().toHex().trim();
									archive.file(path.resolve(this.model.computed, bufferKey), { name: bufferKey });

									return callback();
								}, function(error) {
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

	/**
		Check if the requirements are satisfied

		@method _checkReqs
		@returns {Promise} - success if requirements are satisfied, reject otherwise
	*/

	_checkReqs() {
		return new Promise((success, reject) => {
			fs.readdir(this.model.computed, function(err, files) {
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
				let list = removeHidden(files);

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

				return success();
			});
		});
	}

	/**
		Checks if pass model type is one of the supported ones
		
		@method _validateType
		@params {Buffer} passBuffer - buffer of the pass structure content
		@returns {Boolean} - true if type is supported, false otherwise.
	*/

	_validateType(passBuffer) {
		try {
			let passFile = JSON.parse(passBuffer.toString("utf8"));

			return this.passTypes.some(passType => passFile.hasOwnProperty(passType));
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

				Object.keys(options).forEach(opt => passFile[opt] = options[opt]);

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

			if (!options.modelName || typeof options.modelName !== "string") {
				return reject({
					status: false,
					error: {
						message: "A string model name must be provided in order to continue.",
						ecode: 418
					}
				});
			}

			this.model.dir = path.resolve(__dirname, options.modelDir);
			this.model.name = options.modelName;
			this.model.computed = path.resolve(this.model.dir, `${this.model.name}.pass`);

			this.Certificates.dir = options.certificates.dir;

			let certPaths = Object.keys(options.certificates)
				.filter(v => v !== "dir")
				.map((val) =>
					path.resolve(
						this.Certificates.dir,
						typeof options.certificates[val] !== "object" ? options.certificates[val] : options.certificates[val]["keyFile"]
					)
				);

			async.parallel([
				certsParseCallback => {
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

						return __certsParseCallback();
					});
				},

				handlersAssignCallback => {
					this.handlers = options.handlers || {};
					return __handlersAssignCallback();
				}
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
