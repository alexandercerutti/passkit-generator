const fs = require("fs");
const path = require("path");
const stream = require("stream");
const util = require("util");
const forge = require("node-forge");
const archiver = require("archiver");
const async = require("async");
const moment = require("moment");
const schema = require("./schema");
const fields = require("./fields");

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

class Pass {
	constructor(options) {
		this.options = options;
		this.overrides = this.options.overrides || {};
		this.Certificates = {};
		this.model = "";
		this.l10n = {};

		fields.areas.forEach(a => this[a] = new fields.FieldsArea());
	}

	/**
	 * Generates the pass Stream
	 *
	 * @async
	 * @method generate
	 * @return {Promise<Stream>} A Promise containing the stream of the generated pass.
	*/

	generate() {
		let archive = archiver("zip");

		return this._parseSettings(this.options)
			.then(() => readdir(this.model))
			.catch((err) => {
				if (err.code && err.code === "ENOENT") {
					throw new Error(`Model ${this.model ? this.model+" " : ""}not found. Provide a valid one to continue`);
				}

				throw new Error(err);
			})
			.then(files => {
				// list without dynamic components like manifest, signature or pass files (will be added later in the flow) and hidden files.
				let noDynList = removeHidden(files).filter(f => !/(manifest|signature|pass)/i.test(f));

				if (!noDynList.length || !noDynList.some(f => f.includes("icon"))) {
					throw new Error(`Provided model (${path.parse(this.model).name}) matched but unitialized or may not contain icon. Refer to https://apple.co/2IhJr0Q, https://apple.co/2Nvshvn and documentation to fill the model correctly.`);
				}

				// list without localization files (they will be added later in the flow)
				let bundle = noDynList.filter(f => !f.includes(".lproj"));

				// Localization folders only
				const L10N = noDynList.filter(f => f.includes(".lproj") && Object.keys(this.l10n).includes(path.parse(f).name));

				let _passExtractor = (() => {
					return readFile(path.resolve(this.model, "pass.json"))
						.then(passStructBuffer => {
							if (!this._validateType(passStructBuffer)) {
								throw new Error(`Unable to validate pass type or pass file is not a valid buffer. Check the syntax of your pass.json file or refer to https://apple.co/2Nvshvn and to use a valid type.`)
							}

							bundle.push("pass.json");

							return this._patch(this._filterOptions(this.overrides), passStructBuffer);
						});
				});

				return Promise.all(L10N.map(f => readdir(path.join(this.model, f)).then(removeHidden)))
					.then(listByFolder => {
						listByFolder.forEach((folder, index) => bundle.push(...folder.map(f => path.join(L10N[index], f))));

						return Promise.all([...bundle.map(f => readFile(path.resolve(this.model, f))), _passExtractor()]).then(buffers => {
							Object.keys(this.l10n).forEach(l => {
								const strings = this._generateStringFile(l);
								if (strings.length) {
									buffers.push(strings);
									bundle.push(path.join(`${l}.lproj`, `pass.strings`));
								}
							});

							return [buffers, bundle];
						});
					})
			})
			.then(([buffers, bundle]) => {
				/*
				 * Parsing the buffers and pushing them into the archive
				 */

				let manifest = {};

				let hashAppendTemplate = ((buffer, key) => {
					let hashFlow = forge.md.sha1.create();
					hashFlow.update(buffer.toString("binary"));

					manifest[key] = hashFlow.digest().toHex();

					archive.append(buffer, { name: key });
					return Promise.resolve();
				});

				let passFilesFn = buffers.map((buf, index) => hashAppendTemplate.bind(null, buf, bundle[index])());

				return Promise.all(passFilesFn).then(() => manifest);
			})
			.then((manifest) => {
				archive.append(JSON.stringify(manifest), { name: "manifest.json" });

				let signatureBuffer = this._sign(manifest);
				archive.append(signatureBuffer, { name: "signature" });

				let passStream = new stream.PassThrough();

				archive.pipe(passStream);

				return archive.finalize().then(() => passStream);
			});
	}

	/**
	 * Adds traslated strings object to the list of translation to be inserted into the pass
	 *
	 * @method localize
	 * @params {String} lang - the ISO 3166 alpha-2 code for the language
	 * @params {Object} translations - key/value pairs where key is the
	 * 		string appearing in pass.json and value the translated string
	 *
	 * @see https://apple.co/2KOv0OW - Passes support localization
	 */

	localize(lang, translations) {
		if (typeof translations === "object") {
			this.l10n[lang] = translations;
		}

		return this;
	}

	/**
	 * Creates a buffer of translations in Apple .strings format
	 *
	 * @method _generateStringFile
	 * @params {String} lang - the ISO 3166 alpha-2 code for the language
	 * @returns {Buffer} - Buffer to be written in pass.strings for language in lang
	 * @see https://apple.co/2M9LWVu - String Resources
	 */

	_generateStringFile(lang) {
		if (!Object.keys(this.l10n[lang]).length) {
			return Buffer.from("", "utf8");
		}

		let strings = Object.keys(this.l10n[lang]).map(key => `"${key}" = "${this.l10n[lang][key].replace(/"/g, /\\"/)}";`);
		return Buffer.from(strings.join("\n"), "utf8");
	}

	/**
	 * Checks if pass model type is one of the supported ones
	 *
	 * @method _validateType
	 * @params {Buffer} passBuffer - buffer of the pass structure content
	 * @returns {Boolean} true if type is supported, false otherwise.
	 */

	_validateType(passBuffer) {
		let passTypes = ["boardingPass", "eventTicket", "coupon", "generic", "storeCard"];

		try {
			let passFile = JSON.parse(passBuffer.toString("utf8"));
			let index = passTypes.findIndex(passType => passFile.hasOwnProperty(passType));

			if (index == -1) {
				return false;
			}

			let type = passTypes[index];

			this.type = type;
			return schema.isValid(passFile[type], schema.constants[(type === "boardingPass" ? "boarding" : "basic") + "Structure"]);
		} catch (e) {
			return false;
		}
	}

	/**
	 * Generates the PKCS #7 cryptografic signature for the manifest file.
	 *
	 * @method _sign
	 * @params {String|Object} manifest - Manifest content.
	 * @returns {Buffer}
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
	 * Edits the buffer of pass.json based on the passed options.
	 *
	 * @method _patch
	 * @params {Object} options - options resulting from the filtering made by filterPassOptions function
	 * @params {Buffer} passBuffer - Buffer of the contents of pass.json
	 * @returns {Promise<Buffer>} Edited pass.json buffer or Object containing error.
	 */

	_patch(options, passBuffer) {
		if (!options) {
			return Promise.resolve(passBuffer);
		}

		let passFile = JSON.parse(passBuffer.toString("utf8"));

		// "barcodes" support got introduced in iOS 9 as array of barcode.
		// "barcode" is still used in older iOS versions

		if (passFile["barcode"]) {
			let barcode = passFile["barcode"];

			if (!(barcode instanceof Object) || !schema.isValid(barcode, schema.constants.barcode) || !options.barcode && barcode.message === "") {
				console.log("\x1b[41m", `Barcode syntax of the chosen model (${path.parse(this.model).base}) is not correct and got removed or the override content was not provided. Please refer to https://apple.co/2myAbst.`, "\x1b[0m");
				delete passFile["barcode"];
			} else {
				// options.barcode may not be defined
				passFile["barcode"].message = options.barcode || passFile["barcode"].message;
			}
		} else {
			console.log("\x1b[33m", `Your pass model (${path.parse(this.model).base}) is not compatible with iOS versions lower than iOS 9. Please refer to https://apple.co/2O5K65k to make it backward-compatible.`, "\x1b[0m");
		}

		if (passFile["barcodes"] && passFile["barcodes"] instanceof Array) {
			if (!passFile["barcodes"].length) {
				console.log("\x1b[33m", `No barcodes support specified. The element got removed.`, "\x1b[0m");
				delete passFile["barcodes"];
			}

			passFile["barcodes"].forEach((b,i) => {
				if (!schema.isValid(b, schema.constants.barcode) && !!options.barcode && b.message !== "") {
					passFile["barcodes"].splice(i, 1);
					console.log("\x1b[41m", `Barcode @ index ${i} of the chosen model (${path.parse(this.model).base}) is not well-formed or have syntax errors and got removed. Please refer to https://apple.co/2myAbst.`, "\x1b[0m");
				} else {
					// options.barcode may not be defined
					b.message = options.barcode || b.message;
				}
			});
		} else {
			console.log("\x1b[33m", `Your pass model (${path.parse(this.model).base}) is not compatible with iOS versions greater than iOS 8. Refer to https://apple.co/2O5K65k to make it forward-compatible.`, "\x1b[0m");
		}

		delete options["barcode"];

		Object.assign(passFile, options);

		fields.areas.forEach(area => {
			if (this[area].fields.length) {
				passFile[this.type][area].push(...this[area].fields);
			}
		});

		return Promise.resolve(Buffer.from(JSON.stringify(passFile)));
	}

	/**
	 * Filters the options received in the query from http request into supported options
	 * by Apple and this application.
	 *
	 * @method _filterOptions
	 * @params {Object} opts - raw informations to be edited in the pass.json file
	 *							from HTTP Request Params or Body
	 * @returns {Object} - filtered options based on above criterias.
	 */

	_filterOptions(opts) {
		const forbidden = ["primaryFields", "secondaryFields", "auxiliaryFields", "backFields", "headerFields"];
		const supported = ["serialNumber", "userInfo", "expirationDate", "locations", "authenticationToken", "barcode"];

		let valid = Object.keys(opts).filter(o => !forbidden.includes(o) && supported.includes(o));

		return Object.assign(...valid.map(v => ({ [v]: opts[v] })), {});
	}

	/**
	 * Validates the contents of the passed options and assigns the contents to the right properties
	 *
	 * @async
	 * @method _parseSettings
	 * @params {Object} options - the options passed to be parsed
	 * @returns {Promise}
	 */

	_parseSettings(options) {
		if (!schema.isValid(options, schema.constants.instance)) {
			return Promise.reject("The options passed to Pass constructor does not meet the requirements. Refer to the documentation to compile them correctly.");
		}

		return new Promise((success, reject) => {
			if (!options.model || typeof options.model !== "string") {
				return reject("A string model name must be provided in order to continue.");
			}

			this.model = path.resolve(options.model) + (!!options.model && !path.extname(options.model) ? ".pass" : "");

			let certPaths = Object.keys(options.certificates)
				.filter(v => v !== "dir")
				.map((val) => path.resolve(typeof options.certificates[val] !== "object" ? options.certificates[val] : options.certificates[val]["keyFile"]));

			async.concat(certPaths, fs.readFile, (err, contents) => {
				if (err) {
					return reject(err);
				}

				contents.forEach(file => {
					let pem = this.__parsePEM(file, options.certificates.signerKey.passphrase);
					if (!pem) {
						return reject("Invalid certificates got loaded. Please provide WWDR certificates and developer signer certificate and key (with passphrase).")
					}

					this.Certificates[pem.key] = pem.value;
				});

				return success();
			});
		});
	}

	/**
	 * Parses the PEM-formatted passed text (certificates)
	 *
	 * @method __parsePEM
	 * @params {String} element - Text content of .pem files
	 * @params {String} passphrase - passphrase for the key
	 * @returns {Object} - Object containing name of the certificate and its parsed content
	 */

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
			return {};
		}
	}
}

/**
 *	Apply a filter to arg0 to remove hidden files names (starting with dot)
 *	@function removeHidden
 *	@params {String[]} from - list of file names
 *	@return {String[]}
 */

function removeHidden(from) {
	return from.filter(e => e.charAt(0) !== ".");
}

module.exports = { Pass };
