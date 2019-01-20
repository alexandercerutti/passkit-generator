const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const stream = require("stream");
const moment = require("moment");
const forge = require("node-forge");
const archiver = require("archiver");
const debug = require("debug");
const got = require("got");

const barcodeDebug = debug("passkit:barcode");
const genericDebug = debug("passkit:generic");
const loadDebug = debug("passkit:load");

const schema = require("./schema");
const formatMessage = require("./messages");
const FieldsContainer = require("./fields");

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const noop = () => { };

class Pass {
	constructor(options) {
		this.Certificates = {
			// Even if this assigning will fail, it will be captured below
			// in _parseSettings, since this won't match with the schema.
			_raw: options.certificates || {},
		};

		options.overrides = options.overrides || {};

		this.l10n = {};
		this._remoteResources = [];
		this.shouldOverwrite = !(options.hasOwnProperty("shouldOverwrite") && !options.shouldOverwrite);

		this._fields = ["primaryFields", "secondaryFields", "auxiliaryFields", "backFields", "headerFields"];

		this._fields.forEach(a => this[a] = new FieldsContainer());
		this._transitType = "";

		// Assigning model and _props to this
		Object.assign(this, this._parseSettings(options));
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

		return readCertificates(this.Certificates)
			.then((certs) => Object.assign(this.Certificates, certs))
			.then(() => readdir(this.model))
			.catch((err) => {
				// May have not used this catch but ENOENT error is not enough self-explanatory
				// in the case of internal usage ()
				if (err.code && err.code === "ENOENT") {
					throw new Error(formatMessage("MODEL_NOT_FOUND", this.model));
				}

				throw new Error(err);
			})
			.then(filesList => {
				if (!this._remoteResources.length) {
					return [filesList, [], []];
				}

				let buffersPromise = this._remoteResources.map((r) => {
					return got(r[0], { encoding: null })
						.then(response => {
							loadDebug(formatMessage("LOAD_MIME", response.headers["content-type"]));

							if (!Buffer.isBuffer(response.body)) {
								throw "LOADED_RESOURCE_NOT_A_BUFFER";
							}

							if (!response.headers["content-type"].includes("image/")) {
								throw "LOADED_RESOURCE_NOT_A_PICTURE";
							}

							return response.body;
						})
						.catch(e => {
							loadDebug(formatMessage("LOAD_NORES", r[1], e));
							// here we are adding undefined values, that will be removed later.
							return undefined;
						});
				});

				// forwarding model files list, remote files list and remote buffers.
				return [
					filesList,
					buffersPromise.length ? this._remoteResources.map(r => r[1]) : [],
					buffersPromise
				];
			})
			.then(([modelFileList, remoteFilesList, remoteBuffers]) => {
				// list without dynamic components like manifest, signature or pass files (will be added later in the flow) and hidden files.
				let noDynList = removeHidden(modelFileList).filter(f => !/(manifest|signature|pass)/i.test(f));

				if (!noDynList.length || ![...noDynList, ...remoteFilesList].some(f => f.toLowerCase().includes("icon"))) {
					let eMessage = formatMessage("MODEL_UNINITIALIZED", path.parse(this.model).name);
					throw new Error(eMessage);
				}

				// list without localization files (they will be added later in the flow)
				let bundle = noDynList.filter(f => !f.includes(".lproj"));

				// Localization folders only
				const L10N = noDynList.filter(f => f.includes(".lproj") && Object.keys(this.l10n).includes(path.parse(f).name));

				/**
				 * Reads pass.json file and apply patches on it
				 * @function
				 * @name passExtractor
				 * @return {Promise<Buffer>} The patched pass.json buffer
				 */

				let passExtractor = (() => {
					return readFile(path.resolve(this.model, "pass.json"))
						.then(passStructBuffer => {
							if (!this._validateType(passStructBuffer)) {
								let eMessage = formatMessage("PASSFILE_VALIDATION_FAILED");
								throw new Error(eMessage);
							}

							bundle.push("pass.json");

							return this._patch(passStructBuffer);
						});
				});

				/*
				 * Reading all the localization selected folders and removing hidden files (the ones that starts with ".")
				 * from the list. Returning a Promise containing all those files
				 */

				return Promise.all(L10N.map(f => readdir(path.join(this.model, f)).then(removeHidden)))
					.then(listByFolder => {
						/* Each localization file name is joined with its own path and pushed to the bundle files array. */

						listByFolder.forEach((folder, index) => bundle.push(...folder.map(f => path.join(L10N[index], f))));

						/* Getting all bundle file buffers, pass.json included, and appending path */

						if (remoteFilesList.length) {
							// Removing files in bundle that also exist in remoteFilesList
							// I'm giving priority to downloaded files
							bundle = bundle.filter(file => !remoteFilesList.includes(file));
						}

						let bundleBuffers = bundle.map(f => readFile(path.resolve(this.model, f)));
						let passBuffer = passExtractor();

						// Resolving all the buffers promises
						return Promise.all([...bundleBuffers, passBuffer, ...remoteBuffers])
							.then(buffers => {
								Object.keys(this.l10n).forEach(l => {
									const strings = generateStringFile(this.l10n[l]);

									/*
									 * if .string file buffer is empty, no translations were added
									 * but still wanted to include the language
									 */

									if (strings.length) {
										buffers.push(strings);
										bundle.push(path.join(`${l}.lproj`, `pass.strings`));
									}
								});

								return [
									// removing undefined values
									buffers.filter(b => !!b),
									[...bundle, ...remoteFilesList]
								];
							});
					});
			})
			.then(([buffers, bundle]) => {
				/*
				 * Parsing the buffers, pushing them into the archive
				 * and returning the compiled manifest
				 */

				return buffers.reduce((acc, current, index) => {
					let filename = bundle[index];
					let hashFlow = forge.md.sha1.create();

					hashFlow.update(current.toString("binary"));
					archive.append(current, { name: filename });

					acc[filename] = hashFlow.digest().toHex();

					return acc;
				}, {});
			})
			.then((manifest) => {
				let signatureBuffer = this._sign(manifest);

				archive.append(signatureBuffer, { name: "signature" });
				archive.append(JSON.stringify(manifest), { name: "manifest.json" });

				let passStream = new stream.PassThrough();

				archive.pipe(passStream);

				FieldsContainer.emptyUnique();

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
	 * @returns {this}
	 *
	 * @see https://apple.co/2KOv0OW - Passes support localization
	 */

	localize(lang, translations) {
		if (lang && typeof lang === "string" && (typeof translations === "object" || translations === undefined)) {
			this.l10n[lang] = translations || {};
		}

		return this;
	}

	/**
	 * Sets expirationDate property to the W3C date
	 *
	 * @method expiration
	 * @params {String} date - the date in string
	 * @params {String} format - a custom format for the date
	 * @returns {this}
	 */

	expiration(date, format) {
		if (typeof date !== "string") {
			return this;
		}

		let dateParse = dateToW3CString(date, format);

		if (!dateParse) {
			genericDebug(formatMessage("DATE_FORMAT_UNMATCH", "Expiration date"));
		} else {
			this._props.expirationDate = dateParse;
		}

		return this;
	}

	/**
	 * Sets voided property to true
	 *
	 * @method void
	 * @return {this}
	 */

	void() {
		this._props.voided = true;
		return this;
	}

	/**
	 * Checks and sets data for "beacons", "locations", "maxDistance" and "relevantDate" keys
	 *
	 * @method relevance
	 * @params {String} type - one of the key above
	 * @params {Any[]} data - the data to be pushed to the property
	 * @params {String} [relevanceDateFormat] - A custom format for the date
	 * @return {Number} The quantity of data pushed
	 */

	relevance(type, data, relevanceDateFormat) {
		let types = ["beacons", "locations", "maxDistance", "relevantDate"];

		if (!type || !data || !types.includes(type)) {
			return Object.assign({
				length: 0
			}, this);
		}

		if (type === "beacons" || type === "locations") {
			if (!(data instanceof Array)) {
				data = [data];
			}

			let valid = data.filter(d => schema.isValid(d, type + "Dict"));

			this._props[type] = valid.length ? valid : undefined;

			return Object.assign({
				length: valid.length
			}, this);
		}

		if (type === "maxDistance" && (typeof data === "string" || typeof data === "number")) {
			let conv = Number(data);
			// condition to proceed
			let cond = isNaN(conv);

			if (!cond) {
				this._props[type] = conv;
			}

			return Object.assign({
				length: Number(!cond)
			}, this);
		} else if (type === "relevantDate") {
			let dateParse = dateToW3CString(data, relevanceDateFormat);

			if (!dateParse) {
				genericDebug(formatMessage("DATE_FORMAT_UNMATCH", "Relevant Date"));
			} else {
				this._props[type] = dateParse;
			}

			return Object.assign({
				length: Number(!!dateParse)
			}, this);
		}
	}

	/**
	 * Adds barcodes to "barcode" and "barcodes" properties.
	 * It will let later to add the missing versions
	 *
	 * @method barcode
	 * @params {Object|String} data - the data to be added
	 * @return {this} Improved this with length property and other methods
	 */

	barcode(data) {
		if (!data) {
			return Object.assign({
				length: 0,
				autocomplete: noop,
				backward: noop
			}, this);
		}

		if (typeof data === "string" || (data instanceof Object && !data.format && data.message)) {
			let autogen = this.__barcodeAutogen(data instanceof Object ? data : { message: data });

			this._props["barcode"] = autogen[0] || {};
			this._props["barcodes"] = autogen || [];

			return Object.assign({
				length: 4,
				autocomplete: noop,
				backward: this.__barcodeChooseBackward.bind(this)
			}, this);
		}

		if (!(data instanceof Array)) {
			data = [data];
		}

		// messageEncoding is required but has a default value.
		// Therefore I assign a validated version of the object with the default value
		// to the ones that doesn't have messageEncoding.
		// if o is not a valid object, false is returned and then filtered later

		let valid = data
			.map(o => schema.getValidated(o, "barcode"))
			.filter(o => o instanceof Object);

		if (valid.length) {
			this._props["barcode"] = valid[0];
			this._props["barcodes"] = valid;
		}

		// I bind "this" to get a clean context (without these two methods) when returning from the methods

		return Object.assign({
			length: valid.length,
			autocomplete: this.__barcodeAutocomplete.bind(this),
			backward: this.__barcodeChooseBackward.bind(this)
		}, this);
	}

	/**
	 * Automatically generates barcodes for all the types given common info
	 *
	 * @method __barcodeAutogen
	 * @params {Object} data - common info, may be object or the message itself
	 * @params {String} data.message - the content to be placed inside "message" field
	 * @params {String} [data.altText=data.message] - alternativeText, is message content if not overwritten
	 * @params {String} [data.messageEncoding=iso-8859-1] - the encoding
	 * @return {Object[]} Object array barcodeDict compliant
	 */

	__barcodeAutogen(data) {
		if (!data || !(data instanceof Object) || !data.message) {
			barcodeDebug(formatMessage("BRC_AUTC_MISSING_DATA"));
			return [];
		}

		let types = ["PKBarcodeFormatQR", "PKBarcodeFormatPDF417", "PKBarcodeFormatAztec", "PKBarcodeFormatCode128"];

		data.altText = data.altText || data.message;
		data.messageEncoding = data.messageEncoding || "iso-8859-1";
		delete data.format;

		return types.map(T => Object.assign({ format: T }, data));
	}

	/**
	 * Given an already compiled props["barcodes"] with missing objects
	 * (less than 4), takes infos from the first object and replicate them
	 * in the missing structures.
	 *
	 * @method __barcodeAutocomplete
	 * @returns {this} Improved this, with length property and retroCompatibility method.
	 */

	__barcodeAutocomplete() {
		let props = this._props["barcodes"];

		if (props.length === 4 || !props.length) {
			return Object.assign({
				length: 0,
				backward: this.__barcodeChooseBackward.bind(this)
			}, this);
		}

		this._props["barcodes"] = this.__barcodeAutogen(props[0]);

		return Object.assign({
			length: 4 - props.length,
			backward: this.__barcodeChooseBackward.bind(this)
		}, this);
	}

	/**
	 * Given an index <= the amount of already set "barcodes",
	 * this let you choose which structure to use for retrocompatibility
	 * property "barcode".
	 *
	 * @method __barcodeChooseBackward
	 * @params {String} format - the format, or part of it, to be used
	 * @return {this}
	 */

	__barcodeChooseBackward(format) {
		if (format === null) {
			this._props["barcode"] = undefined;
			return this;
		}

		if (typeof format !== "string") {
			barcodeDebug(formatMessage("BRC_FORMAT_UNMATCH"));
			return this;
		}

		// Checking which object among barcodes has the same format of the specified one.
		let index = this._props["barcodes"].findIndex(b => b.format.toLowerCase().includes(format.toLowerCase()));

		if (index === -1) {
			barcodeDebug(formatMessage("BRC_NOT_SUPPORTED"));
			return this;
		}

		this._props["barcode"] = this._props["barcodes"][index];

		return this;
	}

	/**
	 * Sets nfc fields in properties
	 *
	 * @method nfc
	 * @params {Array<Object>} data - the data to be pushed in the pass
	 * @returns {this}
	 */

	nfc(...data) {
		if (data.length === 1 && data[0] instanceof Array) {
			data = data[0];
		}

		let valid = data.filter(d => d instanceof Object && schema.isValid(d, "nfcDict"));

		if (valid.length) {
			this._props["nfc"] = valid;
		}

		return this;
	}

	/**
	 * Loads a web resource (image)
	 * @param {string} resource
	 * @param {string} name
	 */

	load(resource, name) {
		if (typeof resource !== "string" && typeof name !== "string") {
			loadDebug(formatMessage("LOAD_TYPES_UNMATCH"));
			return;
		}

		this._remoteResources.push([resource, name]);

		return this;
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

		let passFile = JSON.parse(passBuffer.toString("utf8"));
		let index = passTypes.findIndex(passType => passFile.hasOwnProperty(passType));

		if (index == -1) {
			return false;
		}

		let type = passTypes[index];

		this.type = type;
		return schema.isValid(passFile[type], "passDict");
	}

	/**
	 * Generates the PKCS #7 cryptografic signature for the manifest file.
	 *
	 * @method _sign
	 * @params {Object} manifest - Manifest content.
	 * @returns {Buffer}
	 */

	_sign(manifest) {
		let signature = forge.pkcs7.createSignedData();

		signature.content = forge.util.createBuffer(JSON.stringify(manifest), "utf8");

		signature.addCertificate(this.Certificates.wwdr);
		signature.addCertificate(this.Certificates.signerCert);

		/**
		 * authenticatedAttributes belong to PKCS#9 standard.
		 * It requires at least 2 values:
		 * • content-type (which is a PKCS#7 oid) and
		 * • message-digest oid.
		 *
		 * Wallet requires a signingTime.
		 */

		signature.addSigner({
			key: this.Certificates.signerKey,
			certificate: this.Certificates.signerCert,
			authenticatedAttributes: [{
				type: forge.pki.oids.contentType,
				value: forge.pki.oids.data
			}, {
				type: forge.pki.oids.messageDigest,
			}, {
				type: forge.pki.oids.signingTime,
			}]
		});

		/**
		 * We are creating a detached signature because we don't need the signed content.
		 * Detached signature is a property of PKCS#7 cryptography standard.
		 */

		signature.sign({ detached: true });

		/**
		 * Signature here is an ASN.1 valid structure (DER-compliant).
		 * Generating a non-detached signature, would have pushed inside signature.contentInfo
		 * (which has type 16, or "SEQUENCE", and is an array) a Context-Specific element, with the signed
		 * signed content as value.
		 *
		 * In fact the previous approach was to generating a detached signature and the pull away the generated
		 * content.
		 *
		 * That's what happens when you copy a fu****g line without understanding what it does.
		 * Well, nevermind, it was funny to study BER, DER, CER, ASN.1 and PKCS#7. You can learn a lot
		 * of beautiful things. ¯\_(ツ)_/¯
		 */

		return Buffer.from(forge.asn1.toDer(signature.toAsn1()).getBytes(), "binary");
	}

	/**
	 * Edits the buffer of pass.json based on the passed options.
	 *
	 * @method _patch
	 * @params {Buffer} passBuffer - Buffer of the contents of pass.json
	 * @returns {Promise<Buffer>} Edited pass.json buffer or Object containing error.
	 */

	_patch(passBuffer) {
		let passFile = JSON.parse(passBuffer.toString("utf8"));

		if (Object.keys(this._props).length) {
			const rgbValues = ["backgroundColor", "foregroundColor", "labelColor"];

			rgbValues.filter(v => this._props[v] && !isValidRGB(this._props[v])).forEach(v => delete this._props[v]);

			if (this.shouldOverwrite) {
				Object.assign(passFile, this._props);
			} else {
				Object.keys(this._props).forEach(prop => {
					if (passFile[prop]) {
						if (passFile[prop] instanceof Array) {
							passFile[prop].push(...this._props[prop]);
						} else if (passFile[prop] instanceof Object) {
							Object.assign(passFile[prop], this._props[prop]);
						}
					} else {
						passFile[prop] = this._props[prop];
					}
				});
			}
		}

		this._fields.forEach(area => {
			if (this[area].fields.length) {
				if (this.shouldOverwrite) {
					passFile[this.type][area] = this[area].fields;
				} else {
					passFile[this.type][area].push(...this[area].fields);
				}
			}
		});

		if (this.type === "boardingPass" && !this.transitType) {
			throw new Error(formatMessage("TRSTYPE_REQUIRED"));
		}

		passFile[this.type]["transitType"] = this.transitType;

		return Buffer.from(JSON.stringify(passFile));
	}

	/**
	 * Validates the contents of the passed options and handle them
	 *
	 * @method _parseSettings
	 * @params {Object} options - the options passed to be parsed
	 * @returns {Object} - model path and filtered options
	 */

	_parseSettings(options) {
		if (!schema.isValid(options, "instance")) {
			throw new Error(formatMessage("REQUIR_VALID_FAILED"));
		}

		if (!options.model || typeof options.model !== "string") {
			throw new Error(formatMessage("MODEL_NOT_STRING"));
		}

		let modelPath = path.resolve(options.model) + (!!options.model && !path.extname(options.model) ? ".pass" : "");

		const filteredOpts = schema.filter(options.overrides, "supportedOptions");

		return {
			model: modelPath,
			_props: filteredOpts
		};
	}

	set transitType(v) {
		if (schema.isValid(v, "transitType")) {
			this._transitType = v;
		} else {
			genericDebug(formatMessage("TRSTYPE_NOT_VALID", v));
			this._transitType = this._transitType || "";
		}
	}

	get transitType() {
		return this._transitType;
	}
}

/**
 * Validates the contents of the passed options and handle them
 *
 * @function readCertificates
 * @params {Object} certificates - certificates object with raw content and, optionally,
 * the already parsed certificates
 * @returns {Object} - parsed certificates to be pushed to Pass.Certificates.
 */

function readCertificates(certificates) {
	if (certificates.wwdr && certificates.signerCert && typeof certificates.signerKey === "object") {
		// Nothing must be added. Void object is returned.
		return Promise.resolve({});
	}

	const raw = certificates._raw;
	const optCertsNames = Object.keys(raw);
	const certPaths = optCertsNames.map((val) => {
		const cert = raw[val];
		const filePath = !(cert instanceof Object) ? cert : cert["keyFile"];
		const resolvedPath = path.resolve(filePath);

		return readFile(resolvedPath);
	});

	return Promise.all(certPaths)
		.then(contents => {
			// Mapping each file content to a PEM structure, returned in form of one-key-object
			// which is conjoint later with the other pems

			return Object.assign(
				...contents.map((file, index) => {
					const certName = optCertsNames[index];
					const pem = parsePEM(certName, file, raw[certName].passphrase);

					if (!pem) {
						throw new Error(formatMessage("INVALID_CERTS", certName));
					}

					return { [certName]: pem };
				})
			);
		}).catch(err => {
			if (!err.path) {
				// Catching error from '.then()';
				throw err;
			}

			throw new Error(formatMessage("INVALID_CERT_PATH", path.parse(err.path).base));
		});
}

/**
 * Parses the PEM-formatted passed text (certificates)
 *
 * @function parsePEM
 * @params {String} element - Text content of .pem files
 * @params {String=} passphrase - passphrase for the key
 * @returns {Object} The parsed certificate or key in node forge format
 */

function parsePEM(pemName, element, passphrase) {
	if (pemName === "signerKey" && passphrase) {
		return forge.pki.decryptRsaPrivateKey(element, String(passphrase));
	} else {
		return forge.pki.certificateFromPem(element);
	}
}

/**
 * Checks if an rgb value is compliant with CSS-like syntax
 *
 * @function isValidRGB
 * @params {String} value - string to analyze
 * @returns {Boolean} True if valid rgb, false otherwise
 */

function isValidRGB(value) {
	if (!value || typeof value !== "string") {
		return false;
	}

	let rgb = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/);

	if (!rgb) {
		return false;
	}

	return rgb.slice(1, 4).every(v => Math.abs(Number(v)) <= 255);
}

/**
 * Converts a date to W3C Standard format
 *
 * @function dateToW3Cstring
 * @params {String} date - The date to be parsed
 * @params {String} [format] - a custom format
 * @returns {String|undefined} The parsed string if the parameter is valid,
 * 	 undefined otherwise
 */

function dateToW3CString(date, format) {
	if (typeof date !== "string") {
		return "";
	}

	let parsedDate = moment(date.replace(/\//g, "-"), format || ["MM-DD-YYYY hh:mm:ss", "DD-MM-YYYY hh:mm:ss"]).format();

	if (parsedDate === "Invalid date") {
		return undefined;
	}

	return parsedDate;
}

/**
 *	Apply a filter to arg0 to remove hidden files names (starting with dot)
 *
 *	@function removeHidden
 *	@params {String[]} from - list of file names
 *	@return {String[]}
 */

function removeHidden(from) {
	return from.filter(e => e.charAt(0) !== ".");
}

/**
 * Creates a buffer of translations in Apple .strings format
 *
 * @function generateStringFile
 * @params {Object} lang - structure containing related to ISO 3166 alpha-2 code for the language
 * @returns {Buffer} Buffer to be written in pass.strings for language in lang
 * @see https://apple.co/2M9LWVu - String Resources
 */

function generateStringFile(lang) {
	if (!Object.keys(lang).length) {
		return Buffer.from("", "utf8");
	}

	// Pass.strings format is the following one for each row:
	// "key" = "value";

	let strings = Object.keys(lang)
		.map(key => `"${key}" = "${lang[key].replace(/"/g, /\\"/)}";`);

	return Buffer.from(strings.join("\n"), "utf8");
}

module.exports = { Pass };
