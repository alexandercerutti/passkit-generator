import path from "path";
import stream, { Stream } from "stream";
import forge from "node-forge";
import archiver from "archiver";
import debug from "debug";

import * as schema from "./schema";
import formatMessage from "./messages";
import FieldsArray from "./fieldsArray";
import {
	assignLength, generateStringFile,
	dateToW3CString, isValidRGB
} from "./utils";

const barcodeDebug = debug("passkit:barcode");
const genericDebug = debug("passkit:generic");


const noop = () => {};
const transitType = Symbol("transitType");
const barcodesFillMissing = Symbol("bfm");
const barcodesSetBackward = Symbol("bsb");

interface PassIndexSignature {
	[key: string]: any;
}

export class Pass implements PassIndexSignature {
	// private model: string;
	private bundle: schema.BundleUnit;
	private l10nBundles: schema.PartitionedBundle["l10nBundle"];
	private _fields: string[];
	private _props: schema.ValidPass;
	private type: string;
	private fieldsKeys: Set<string>;
	private passCore: schema.ValidPass;

	Certificates: schema.FinalCertificates;
	l10nTranslations: { [key: string]: { [key: string]: string } } = {};
	[transitType]: string = "";

	constructor(options: schema.PassInstance) {
		this.Certificates = options.certificates;
		this.l10nBundles = options.model.l10nBundle;
		this.bundle = { ...options.model.bundle };

		options.overrides = options.overrides || {};

		// getting pass.json
		this.passCore = JSON.parse(this.bundle["pass.json"].toString("utf8"));

		this.type = Object.keys(this.passCore).find(key => /(boardingPass|eventTicket|coupon|generic|storeCard)/.test(key));

		if (!this.type) {
			throw new Error("Missing type in model");
		}

		if (this.type === "boardingPass" && this.passCore[this.type]["transitType"]) {
			// We might want to generate a boarding pass without setting manually
			// in the code the transit type but right in the model;
			this[transitType] = this.passCore[this.type]["transitType"];
		}

		this.fieldsKeys = new Set();

		const typeFields = Object.keys(this.passCore[this.type]);

		this._fields = ["primaryFields", "secondaryFields", "auxiliaryFields", "backFields", "headerFields"];
		this._fields.forEach(fieldName => {
			if (typeFields.includes(fieldName)) {
				this[fieldName] = new FieldsArray(
					this.fieldsKeys,
					...this.passCore[this.type][fieldName]
						.filter((field: schema.Field) => schema.isValid(field, "field"))
				);
			} else {
				this[fieldName] = new FieldsArray(this.fieldsKeys);
			}
		});
	}

	/**
	 * Generates the pass Stream
	 *
	 * @async
	 * @method generate
	 * @return {Promise<Stream>} A Promise containing the stream of the generated pass.
	*/

	async generate(): Promise<Stream> {
		// Editing Pass.json

		this.bundle["pass.json"] = this._patch(this.bundle["pass.json"]);

		const finalBundle = { ...this.bundle } as schema.BundleUnit;

		Object.keys(this.l10nTranslations).forEach(lang => {
			const strings = generateStringFile(this.l10nTranslations[lang]);

			if (strings.length) {
				/**
				 * if there's already a buffer of the same folder and called
				 * `pass.strings`, we'll merge the two buffers. We'll create
				 * it otherwise.
			 */

				if (!this.l10nBundles[lang]) {
					this.l10nBundles[lang] = {};
				}

				this.l10nBundles[lang]["pass.strings"] = Buffer.concat([
					this.l10nBundles[lang]["pass.strings"] || Buffer.from("", "utf8"),
					strings
				]);
			}

			if (!(this.l10nBundles[lang] && Object.keys(this.l10nBundles[lang]).length)) {
					return;
				}

				/**
			 * Assigning all the localization files to the final bundle
			 * by mapping the buffer to the pass-relative file path;
				 *
				 * We are replacing the slashes to avoid Windows slashes
				 * composition.
				 */
			Object.assign(finalBundle, ...Object.keys(this.l10nBundles[lang])
				.map(fileName => {
					const fullPath = path.join(`${lang}.lproj`, fileName).replace(/\\/, "/");
					return { [fullPath]: this.l10nBundles[lang][fileName] };
				})
			);
			});

			/*
			 * Parsing the buffers, pushing them into the archive
			 * and returning the compiled manifest
			 */
			const archive = archiver("zip");
		const manifest = Object.keys(finalBundle).reduce((acc, current) => {
				let hashFlow = forge.md.sha1.create();

			hashFlow.update(finalBundle[current].toString("binary"));
			archive.append(current, { name: current });

			acc[current] = hashFlow.digest().toHex();

				return acc;
			}, {});

			const signatureBuffer = this._sign(manifest);

			archive.append(signatureBuffer, { name: "signature" });
			archive.append(JSON.stringify(manifest), { name: "manifest.json" });

			const passStream = new stream.PassThrough();

			archive.pipe(passStream);

			return archive.finalize().then(() => passStream);
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

	localize(lang: string, translations?: { [key: string]: string }) {
		if (lang && typeof lang === "string" && (typeof translations === "object" || translations === undefined)) {
			this.l10nTranslations[lang] = translations || {};
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

	expiration(date: string | Date, format?: string) {
		if (typeof date !== "string" && !(date instanceof Date)) {
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

	void(): this {
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

	relevance(type: string, data: any, relevanceDateFormat?: string) {
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
			if (typeof data !== "string" && !(data instanceof Date)) {
				genericDebug(formatMessage("DATE_FORMAT_UNMATCH", "Relevant Date"));
				return this;
			}

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
	 * @params {Object} data - the data to be pushed in the pass
	 * @returns {this}
	 */

	nfc(data: schema.NFC) {
		if (!(typeof data === "object" && !Array.isArray(data) && schema.isValid(data, "nfcDict"))) {
			genericDebug("Invalid NFC data provided");
			return this;
		}

		this._props["nfc"] = data;

		return this;
	}

	/**
	 * Generates the PKCS #7 cryptografic signature for the manifest file.
	 *
	 * @method _sign
	 * @params {Object} manifest - Manifest content.
	 * @returns {Buffer}
	 */

	_sign(manifest: { [key: string]: string }): Buffer {
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
			key: this.Certificates.signerKey.keyFile,
			certificate: this.Certificates.signerCert,
			digestAlgorithm: forge.pki.oids.sha1,
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

	_patch(passCoreBuffer: Buffer): Buffer {
		const passFile = JSON.parse(passCoreBuffer.toString());

		if (Object.keys(this._props).length) {
			// We filter the existing (in passFile) and non-valid keys from
			// the below array keys that accept rgb values
			// and then delete it from the passFile.
			["backgroundColor", "foregroundColor", "labelColor"]
				.filter(v => this._props[v] && !isValidRGB(this._props[v]))
				.forEach(v => delete this._props[v]);

				Object.keys(this._props).forEach(prop => {
						if (passFile[prop] instanceof Array) {
							passFile[prop].push(...this._props[prop]);
						} else if (passFile[prop] instanceof Object) {
							Object.assign(passFile[prop], this._props[prop]);
					} else {
						passFile[prop] = this._props[prop];
					}
				});
			}

		this._fields.forEach(field => {
			passFile[this.type][field] = this[field];
		});

		if (this.type === "boardingPass" && !this[transitType]) {
			throw new Error(formatMessage("TRSTYPE_REQUIRED"));
		}

		passFile[this.type]["transitType"] = this[transitType];

		return Buffer.from(JSON.stringify(passFile));
	}

	set transitType(v: string) {
		if (schema.isValid(v, "transitType")) {
			this[transitType] = v;
		} else {
			genericDebug(formatMessage("TRSTYPE_NOT_VALID", v));
			this[transitType] = this[transitType] || "";
		}
	}

	get transitType(): string {
		return this[transitType];
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

function barcodesFromUncompleteData(origin: schema.Barcode): schema.Barcode[] {
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
			Object.assign({}, origin, { format }),
			"barcode"
		)
	);
}
