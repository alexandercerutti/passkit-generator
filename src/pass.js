const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const stream = require("stream");
const forge = require("node-forge");
const archiver = require("archiver");
const debug = require("debug");
const got = require("got");

const barcodeDebug = debug("passkit:barcode");
const genericDebug = debug("passkit:generic");
const loadDebug = debug("passkit:load");

const schema = require("./schema");
const formatMessage = require("./messages");
const FieldsArray = require("./fieldsArray");
const {
	assignLength, generateStringFile,
	removeHidden, dateToW3CString,
	isValidRGB
} = require("./utils");

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const noop = () => {};
const transitType = Symbol("transitType");
const barcodesFillMissing = Symbol("bfm");
const barcodesSetBackward = Symbol("bsb");

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

		this._fields.forEach(a => this[a] = new FieldsArray());
		this[transitType] = "";

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

	async generate() {
		try {
			// Reading the model
			const modelFilesList = await readdir(this.model);

			/**
			 * Getting the buffers for remote files
			 */

			const buffersPromise = await this._remoteResources.reduce(async (acc, current) => {
				try {
					const response = await got(current[0], { encoding: null });
					loadDebug(formatMessage("LOAD_MIME", response.headers["content-type"]));

					if (!Buffer.isBuffer(response.body)) {
						throw "LOADED_RESOURCE_NOT_A_BUFFER";
					}

					if (!response.headers["content-type"].includes("image/")) {
						throw "LOADED_RESOURCE_NOT_A_PICTURE";
					}

					return [...acc, response.body];
				} catch (err) {
					loadDebug(formatMessage("LOAD_NORES", current[1], err));
					return acc;
				}
			}, []);

			const remoteFilesList = buffersPromise.length ? this._remoteResources.map(r => r[1]): [];

			// list without dynamic components like manifest, signature or pass files (will be added later in the flow) and hidden files.
			const noDynList = removeHidden(modelFilesList).filter(f => !/(manifest|signature|pass)/i.test(f));
			const hasAssets = noDynList.length || remoteFilesList.length;

			if (!hasAssets || ![...noDynList, ...remoteFilesList].some(f => f.toLowerCase().includes("icon"))) {
				let eMessage = formatMessage("MODEL_UNINITIALIZED", path.parse(this.model).name);
				throw new Error(eMessage);
			}

			// list without localization files (they will be added later in the flow)
			let bundle = noDynList.filter(f => !f.includes(".lproj"));

			// Localization folders only
			const L10N = noDynList.filter(f => f.includes(".lproj") && Object.keys(this.l10n).includes(path.parse(f).name));

			/*
			 * Reading all the localization selected folders and removing hidden files (the ones that starts with ".")
			 * from the list.
			 */

			const listByFolder = await Promise.all(
				L10N.map(async f =>
					removeHidden(await readdir(
						path.join(this.model, f)
					))
				)
			);

			// Pushing into the bundle the composed paths for localization files

			listByFolder.forEach((folder, index) =>
				bundle.push(
					...folder.map(f => path.join(L10N[index], f))
				)
			);

			/* Getting all bundle file buffers, pass.json included, and appending path */

			if (remoteFilesList.length) {
				// Removing files in bundle that also exist in remoteFilesList
				// I'm giving priority to downloaded files
				bundle = bundle.filter(file => !remoteFilesList.includes(file));
			}

			// Reading bundle files to buffers without pass.json - it gets read below
			// to use a different parsing process

			const bundleBuffers = bundle.map(f => readFile(path.resolve(this.model, f)));
			const passBuffer = this._extractPassDefinition();
			bundle.push("pass.json");

			const buffers = await Promise.all([...bundleBuffers, passBuffer, ...buffersPromise]);

			Object.keys(this.l10n).forEach(l => {
				const strings = generateStringFile(this.l10n[l]);

				/**
				 * if .string file buffer is empty, no translations were added
				 * but still wanted to include the language
				 */

				if (!strings.length) {
					return;
				}

				/**
				 * if there's already a buffer of the same folder and called
				 * `pass.strings`, we'll merge the two buffers. We'll create
				 * it otherwise.
				 */

				const stringFilePath = path.join(`${l}.lproj`, "pass.strings");
				const stringFileIndex = bundle.findIndex(file => file === stringFilePath);

				if (stringFileIndex > -1) {
					buffers[stringFileIndex] = Buffer.concat([
						buffers[stringFileIndex],
						strings
					]);
				} else {
					buffers.push(strings);
					bundle.push(stringFilePath);
				}
			});

			// Pushing the remote files into the bundle
			bundle.push(...remoteFilesList);

			/*
			 * Parsing the buffers, pushing them into the archive
			 * and returning the compiled manifest
			 */
			const archive = archiver("zip");
			const manifest = buffers.reduce((acc, current, index) => {
				let filename = bundle[index];
				let hashFlow = forge.md.sha1.create();

				hashFlow.update(current.toString("binary"));
				archive.append(current, { name: filename });

				acc[filename] = hashFlow.digest().toHex();

				return acc;
			}, {});

			// Reading the certificates,
			// signing the manifest, appending signature an manifest to the archive
			// and returning the generated pass stream.

			Object.assign(this.Certificates, await readCertificates(this.Certificates));

			const signatureBuffer = this._sign(manifest);

			archive.append(signatureBuffer, { name: "signature" });
			archive.append(JSON.stringify(manifest), { name: "manifest.json" });

			const passStream = new stream.PassThrough();

			archive.pipe(passStream);

			FieldsArray.emptyUnique();

			return archive.finalize().then(() => passStream);
		} catch (err) {
			if (err.code && err.code === "ENOENT") {
				// No model available at this path - renaming the error
				throw new Error(formatMessage("MODEL_NOT_FOUND", this.model));
			}

			throw new Error(err);
		}
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
			return this;
		}

		this._props.expirationDate = dateParse;

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
			return assignLength(0, this);
		}

		if (type === "beacons" || type === "locations") {
			if (!(data instanceof Array)) {
				data = [data];
			}

			let valid = data.filter(d => schema.isValid(d, type + "Dict"));

			this._props[type] = valid.length ? valid : undefined;

			return assignLength(valid.length, this);
		}

		if (type === "maxDistance" && (typeof data === "string" || typeof data === "number")) {
			let conv = Number(data);
			// condition to proceed
			let cond = isNaN(conv);

			if (!cond) {
				this._props[type] = conv;
			}

			return assignLength(Number(!cond), this);
		} else if (type === "relevantDate") {
			let dateParse = dateToW3CString(data, relevanceDateFormat);

			if (!dateParse) {
				genericDebug(formatMessage("DATE_FORMAT_UNMATCH", "Relevant Date"));
			} else {
				this._props[type] = dateParse;
			}

			return assignLength(Number(!!dateParse), this);
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
			return assignLength(0, this, {
				autocomplete: noop,
				backward: noop,
			});
		}

		if (typeof data === "string" || (data instanceof Object && !Array.isArray(data) && !data.format && data.message)) {
			const autogen = barcodesFromUncompleteData(data instanceof Object ? data : { message: data });

			if (!autogen.length) {
				return assignLength(0, this, {
					autocomplete: noop,
					backward: noop
				});
			}

			this._props["barcode"] = autogen[0];
			this._props["barcodes"] = autogen;

			return assignLength(autogen.length, this, {
				autocomplete: noop,
				backward: (format) => this[barcodesSetBackward](format)
			});
		}

		if (!(data instanceof Array)) {
			data = [data];
		}

		// Stripping from the array not-object elements, objects with no message
		// and the ones that does not pass validation.
		// Validation assign default value to missing parameters (if any).

		const valid = data.reduce((acc, current) => {
			if (!(current && current instanceof Object && current.hasOwnProperty("message"))) {
				return acc;
			}

			const validated = schema.getValidated(current, "barcode");

			if (!(validated && validated instanceof Object && Object.keys(validated).length)) {
				return acc;
			}

			return [...acc, validated];
		}, []);

		if (valid.length) {
			// With this check, we want to avoid that
			// PKBarcodeFormatCode128 gets chosen automatically
			// if it is the first. If true, we'll get 1
			// (so not the first index)
			const barcodeFirstValidIndex = Number(valid[0].format === "PKBarcodeFormatCode128");

			if (valid.length > 0) {
				this._props["barcode"] = valid[barcodeFirstValidIndex];
			}

			this._props["barcodes"] = valid;
		}

		return assignLength(valid.length, this, {
			autocomplete: () => this[barcodesFillMissing](),
			backward: (format) => this[barcodesSetBackward](format),
		});
	}

	/**
	 * Given an already compiled props["barcodes"] with missing objects
	 * (less than 4), takes infos from the first object and replicate them
	 * in the missing structures.
	 *
	 * @method Symbol/barcodesFillMissing
	 * @returns {this} Improved this, with length property and retroCompatibility method.
	 */

	[barcodesFillMissing]() {
		let props = this._props["barcodes"];

		if (props.length === 4 || !props.length) {
			return assignLength(0, this, {
				autocomplete: noop,
				backward: (format) => this[barcodesSetBackward](format)
			});
		}

		this._props["barcodes"] = barcodesFromUncompleteData(props[0]);

		return assignLength(4 - props.length, this, {
			autocomplete: noop,
			backward: (format) => this[barcodesSetBackward](format)
		});
	}

	/**
	 * Given an index <= the amount of already set "barcodes",
	 * this let you choose which structure to use for retrocompatibility
	 * property "barcode".
	 *
	 * @method Symbol/barcodesSetBackward
	 * @params {String} format - the format, or part of it, to be used
	 * @return {this}
	 */

	[barcodesSetBackward](format) {
		if (format === null) {
			this._props["barcode"] = undefined;
			return this;
		}

		if (typeof format !== "string") {
			barcodeDebug(formatMessage("BRC_FORMAT_UNMATCH"));
			return this;
		}

		if (format === "PKBarcodeFormatCode128") {
			barcodeDebug(formatMessage("BRC_BW_FORMAT_UNSUPPORTED"));
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
	 * @method _hasValidType
	 * @params {string} passFile - parsed pass structure content
	 * @returns {Boolean} true if type is supported, false otherwise.
	 */

	_hasValidType(passFile) {
		let passTypes = ["boardingPass", "eventTicket", "coupon", "generic", "storeCard"];

		this.type = passTypes.find(type => passFile.hasOwnProperty(type));

		if (!this.type) {
			genericDebug(formatMessage("NO_PASS_TYPE"));
			return false;
		}

		return schema.isValid(passFile[this.type], "passDict");
	}

	/**
	 * Reads pass.json file and returns the patched version
	 * @function
	 * @name passExtractor
	 * @return {Promise<Buffer>} The patched pass.json buffer
	 */

	async _extractPassDefinition() {
		const passStructBuffer = await readFile(path.resolve(this.model, "pass.json"))
		const parsedPassDefinition = JSON.parse(passStructBuffer.toString("utf8"));

		if (!this._hasValidType(parsedPassDefinition)) {
			const eMessage = formatMessage("PASSFILE_VALIDATION_FAILED");
			throw new Error(eMessage);
		}

		return this._patch(parsedPassDefinition);
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
		 * (which has type 16, or "SEQUENCE", and is an array) a Context-Specific element, with the
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

	_patch(passFile) {
		if (Object.keys(this._props).length) {
			// We filter the existing (in passFile) and non-valid keys from
			// the below array keys that accept rgb values
			// and then delete it from the passFile.
			["backgroundColor", "foregroundColor", "labelColor"]
				.filter(v => this._props[v] && !isValidRGB(this._props[v]))
				.forEach(v => delete this._props[v]);

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
			if (this[area].length) {
				if (this.shouldOverwrite) {
					passFile[this.type][area] = [...this[area]];
				} else {
					passFile[this.type][area].push(...this[area]);
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

		const modelPath = path.resolve(options.model) + (!!options.model && !path.extname(options.model) ? ".pass" : "");
		const filteredOpts = schema.getValidated(options.overrides, "supportedOptions");

		if (!filteredOpts) {
			throw new Error(formatMessage("OVV_KEYS_BADFORMAT"))
		}

		return {
			model: modelPath,
			_props: filteredOpts
		};
	}

	set transitType(v) {
		if (schema.isValid(v, "transitType")) {
			this[transitType] = v;
		} else {
			genericDebug(formatMessage("TRSTYPE_NOT_VALID", v));
			this[transitType] = this[transitType] || "";
		}
	}

	get transitType() {
		return this[transitType];
	}
}

/**
 * Validates the contents of the passed options and handle them
 *
 * @function readCertificates
 * @params {Object} certificates - certificates object with raw content
 * 	and, optionally, the already parsed certificates
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
		// realRawValue exists as signerKey might be an object
		const realRawValue = !(cert instanceof Object) ? cert : cert["keyFile"];

		// We are checking if the string is a path or a content
		if (!!path.parse(realRawValue).ext) {
			const resolvedPath = path.resolve(realRawValue);
			return readFile(resolvedPath);
		} else {
			return Promise.resolve(realRawValue);
		}
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
 * Automatically generates barcodes for all the types given common info
 *
 * @method barcodesFromMessage
 * @params {Object} data - common info, may be object or the message itself
 * @params {String} data.message - the content to be placed inside "message" field
 * @params {String} [data.altText=data.message] - alternativeText, is message content if not overwritten
 * @params {String} [data.messageEncoding=iso-8859-1] - the encoding
 * @return {Object[]} Object array barcodeDict compliant
 */

function barcodesFromUncompleteData(origin) {
	if (!(origin.message && typeof origin.message === "string")) {
		barcodeDebug(formatMessage("BRC_AUTC_MISSING_DATA"));
		return [];
	}

	return [
		"PKBarcodeFormatQR",
		"PKBarcodeFormatPDF417",
		"PKBarcodeFormatAztec",
		"PKBarcodeFormatCode128"
	].map(format =>
		schema.getValidated(
			Object.assign(origin, { format }),
			"barcode"
		)
	);
}

module.exports = { Pass };
