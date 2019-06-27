import path from "path";
import stream, { Stream } from "stream";
import forge from "node-forge";
import { ZipFile } from "yazl";
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

export interface PassWithLengthField extends Pass {
	length: number;
}

export interface PassWithBarcodeMethods extends PassWithLengthField {
	backward: (format: schema.BarcodeFormat) => Pass;
	autocomplete: () => Pass;
}

export class Pass implements PassIndexSignature {
	private bundle: schema.BundleUnit;
	private l10nBundles: schema.PartitionedBundle["l10nBundle"];
	private _fields: (keyof schema.PassFields)[];
	private _props: schema.ValidPass = {};
	private type: keyof schema.ValidPassType;
	private fieldsKeys: Set<string> = new Set<string>();
	private passCore: schema.ValidPass = {};

	public headerFields: FieldsArray;
	public primaryFields: FieldsArray;
	public secondaryFields: FieldsArray;
	public auxiliaryFields: FieldsArray;
	public backFields: FieldsArray;

	Certificates: schema.FinalCertificates;
	l10nTranslations: { [key: string]: { [key: string]: string } } = {};
	[transitType]: string = "";

	constructor(options: schema.PassInstance) {
		if (!schema.isValid(options, "instance")) {
			throw new Error(formatMessage("REQUIR_VALID_FAILED"));
		}

		this.Certificates = options.certificates;
		this.l10nBundles = options.model.l10nBundle;
		this.bundle = { ...options.model.bundle };

		try {
			// getting pass.json
			this.passCore = JSON.parse(this.bundle["pass.json"].toString("utf8"));
		} catch (err) {
			throw new Error(formatMessage("PASSFILE_VALIDATION_FAILED"));
		}

		// Parsing the options and extracting only the valid ones.
		const validOverrides = schema.getValidated(options.overrides || {}, "supportedOptions") as schema.OverridesSupportedOptions;

		if (validOverrides === null) {
			throw new Error(formatMessage("OVV_KEYS_BADFORMAT"))
		}

		this._props = [
			"barcodes", "barcode",
			"expirationDate", "voided",
			"beacons", "locations",
			"relevantDate", "nfc"
		].reduce<schema.ValidPass>((acc, current) => {
			if (!this.passCore[current]) {
				return acc;
			}

			acc[current] = this.passCore[current];
			return acc;
		}, {});

		if (Object.keys(validOverrides).length) {
			this._props = { ...this._props, ...validOverrides };
		}

		this.type = Object.keys(this.passCore)
			.find(key => /(boardingPass|eventTicket|coupon|generic|storeCard)/.test(key)) as keyof schema.ValidPassType;

		if (!this.type) {
			// @TODO: change error message to say it is invalid or missing
			throw new Error(formatMessage("NO_PASS_TYPE"));
		}

		if (this.type === "boardingPass" && this.passCore[this.type]["transitType"]) {
			// We might want to generate a boarding pass without setting manually
			// in the code the transit type but right in the model;
			this[transitType] = this.passCore[this.type]["transitType"];
		}

		this._fields = ["primaryFields", "secondaryFields", "auxiliaryFields", "backFields", "headerFields"];
		this._fields.forEach(fieldName => {
			this[fieldName] = new FieldsArray(
				this.fieldsKeys,
				...(this.passCore[this.type][fieldName] || [])
					.filter(field => schema.isValid(field, "field"))
			);
		});
	}

	/**
	 * Generates the pass Stream
	 *
	 * @method generate
	 * @return A Stream of the generated pass.
	 */

	generate(): Stream {
		// Editing Pass.json
		this.bundle["pass.json"] = this._patch(this.bundle["pass.json"]);

		const finalBundle = { ...this.bundle } as schema.BundleUnit;

		/**
		 * Iterating through languages and generating pass.string file
		 */

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
					this.l10nBundles[lang]["pass.strings"] || Buffer.alloc(0),
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
		const archive = new ZipFile();
		const manifest = Object.keys(finalBundle).reduce((acc, current) => {
			let hashFlow = forge.md.sha1.create();

			hashFlow.update(finalBundle[current].toString("binary"));
			archive.addBuffer(finalBundle[current], current);
			acc[current] = hashFlow.digest().toHex();

			return acc;
		}, {});

		const signatureBuffer = this._sign(manifest);

		archive.addBuffer(signatureBuffer, "signature");
		archive.addBuffer(Buffer.from(JSON.stringify(manifest)), "manifest.json");
		const passStream = new stream.PassThrough();

		archive.outputStream.pipe(passStream);
		archive.end();

		return passStream;
	}

	/**
	 * Adds traslated strings object to the list of translation to be inserted into the pass
	 *
	 * @method localize
	 * @params lang - the ISO 3166 alpha-2 code for the language
	 * @params translations - key/value pairs where key is the
	 * 		placeholder in pass.json localizable strings
	 * 		and value the real translated string.
	 * @returns {this}
	 *
	 * @see https://apple.co/2KOv0OW - Passes support localization
	 */

	localize(lang: string, translations?: { [key: string]: string }): this {
		if (lang && typeof lang === "string" && (typeof translations === "object" || translations === undefined)) {
			this.l10nTranslations[lang] = translations || {};
		}

		return this;
	}

	/**
	 * Sets expirationDate property to a W3C-formatted date
	 *
	 * @method expiration
	 * @params date
	 * @returns {this}
	 */

	expiration(date: Date): this {
		if (!(date instanceof Date)) {
			return this;
		}

		const dateParse = dateToW3CString(date);

		if (!dateParse) {
			genericDebug(formatMessage("DATE_FORMAT_UNMATCH", "Expiration date"));
			return this;
		}

		this._props["expirationDate"] = dateParse;

		return this;
	}

	/**
	 * Sets voided property to true
	 *
	 * @method void
	 * @return {this}
	 */

	void(): this {
		this._props["voided"] = true;
		return this;
	}

	/**
	 * Sets current pass' relevancy through beacons
	 * @param data
	 * @returns {Pass}
	 */

	beacons(...data: schema.Beacon[]): PassWithLengthField {
		if (!data || !data.length) {
			return assignLength(0, this);
		}

		const validBeacons = data.reduce<schema.Beacon[]>((acc, current) => {
			if (!(Object.keys(current).length && schema.isValid(current, "beaconsDict"))) {
				return acc;
			}

			return [...acc, current];
		}, []);

		if (!validBeacons.length) {
			return assignLength(0, this);
		}

		this._props["beacons"] = validBeacons;

		return assignLength(validBeacons.length, this);
	}

	/**
	 * Sets current pass' relevancy through locations
	 * @param data
	 * @returns {Pass}
	 */

	locations(...data: schema.Location[]): PassWithLengthField {
		if (!data.length) {
			return assignLength(0, this);
		}

		const validLocations = data.reduce<schema.Location[]>((acc, current) => {
			if (!(Object.keys(current).length && schema.isValid(current, "locationsDict"))) {
				return acc;
			}

			return [...acc, current];
		}, []);

		if (!validLocations.length) {
			return assignLength(0, this);
		}

		this._props["locations"] = validLocations;

		return assignLength(validLocations.length, this);
	}

	/**
	 * Sets current pass' relevancy through a date
	 * @param data
	 * @returns {Pass}
	 */

	relevantDate(date: Date): this {
		if (!(date instanceof Date)) {
			genericDebug(formatMessage("DATE_FORMAT_UNMATCH", "Relevant Date"));
			return this;
		}

		const parsedDate = dateToW3CString(date);

		if (!parsedDate) {
			// @TODO: create message "Unable to format date"
			return this;
		}

		this._props["relevantDate"] = parsedDate;
		return this;
	}

	/**
	 * Adds barcodes to "barcode" and "barcodes" properties.
	 * It will let to add the missing versions later.
	 *
	 * @method barcode
	 * @params data - the data to be added
	 * @return {this} Improved this with length property and other methods
	 */

	barcode(first: string | schema.Barcode, ...data: schema.Barcode[]): PassWithBarcodeMethods {
		const isFirstParameterValid = (
			first && (
				typeof first === "string" && first.length || (
					typeof first === "object" &&
					first.hasOwnProperty("message")
				)
			)
		);

		if (!isFirstParameterValid) {
			return assignLength(0, this, {
				autocomplete: noop,
				backward: noop,
			});
		}

		if (typeof first === "string") {
			const autogen = barcodesFromUncompleteData(first);

			if (!autogen.length) {
				barcodeDebug(formatMessage("BRC_AUTC_MISSING_DATA"));
				return assignLength(0, this, {
					autocomplete: noop,
					backward: noop,
				});
			}

			this._props["barcode"] = autogen[0];
			this._props["barcodes"] = autogen;

			return assignLength(autogen.length, this, {
				autocomplete: noop,
				backward: (format: schema.BarcodeFormat) => this[barcodesSetBackward](format)
			});
		} else {
			const barcodes = [first, ...(data || [])];

			/**
			 * Stripping from the array not-object elements
			 * and the ones that does not pass validation.
			 * Validation assign default value to missing parameters (if any).
			 */

			const valid = barcodes.reduce<schema.Barcode[]>((acc, current) => {
				if (!(current && current instanceof Object)) {
					return acc;
				}

				const validated = schema.getValidated(current, "barcode");

				if (!(validated && validated instanceof Object && Object.keys(validated).length)) {
					return acc;
				}

				return [...acc, validated] as schema.Barcode[];
			}, []);

			if (valid.length) {
				/**
				 * With this check, we want to avoid that
				 * PKBarcodeFormatCode128 gets chosen automatically
				 * if it is the first. If true, we'll get 1
				 * (so not the first index)
				 */
				const barcodeFirstValidIndex = Number(valid[0].format === "PKBarcodeFormatCode128");

				if (valid.length > 0 && valid[barcodeFirstValidIndex]) {
					this._props["barcode"] = valid[barcodeFirstValidIndex];
				}

				this._props["barcodes"] = valid;
			}

			return assignLength(valid.length, this, {
				autocomplete: () => this[barcodesFillMissing](),
				backward: (format: schema.BarcodeFormat) => this[barcodesSetBackward](format),
			});
		}
	}

	/**
	 * Given an already compiled props["barcodes"] with missing objects
	 * (less than 4), takes infos from the first object and replicate them
	 * in the missing structures.
	 *
	 * @method Symbol/barcodesFillMissing
	 * @returns {this} Improved this, with length property and retroCompatibility method.
	 */

	private [barcodesFillMissing](): this {
		const { barcodes } = this._props;

		if (barcodes.length === 4 || !barcodes.length) {
			return assignLength(0, this, {
				autocomplete: noop,
				backward: (format: schema.BarcodeFormat) => this[barcodesSetBackward](format)
			});
		}

		this._props["barcodes"] = barcodesFromUncompleteData(barcodes[0].message);

		return assignLength(4 - barcodes.length, this, {
			autocomplete: noop,
			backward: (format: schema.BarcodeFormat) => this[barcodesSetBackward](format)
		});
	}

	/**
	 * Given an index <= the amount of already set "barcodes",
	 * this let you choose which structure to use for retrocompatibility
	 * property "barcode".
	 *
	 * @method Symbol/barcodesSetBackward
	 * @params format - the format to be used
	 * @return {this}
	 */

	private [barcodesSetBackward](chosenFormat: schema.BarcodeFormat | null): this {
		let { barcode, barcodes } = this._props;

		if (chosenFormat === null) {
			barcode = undefined;
			return this;
		}

		if (typeof chosenFormat !== "string") {
			barcodeDebug(formatMessage("BRC_FORMATTYPE_UNMATCH"));
			return this;
		}

		if (chosenFormat === "PKBarcodeFormatCode128") {
			barcodeDebug(formatMessage("BRC_BW_FORMAT_UNSUPPORTED"));
			return this;
		}

		// Checking which object among barcodes has the same format of the specified one.
		const index = barcodes.findIndex(b => b.format.toLowerCase().includes(chosenFormat.toLowerCase()));

		if (index === -1) {
			barcodeDebug(formatMessage("BRC_NOT_SUPPORTED"));
			return this;
		}

		barcode = barcodes[index];
		return this;
	}

	/**
	 * Sets nfc fields in properties
	 *
	 * @method nfc
	 * @params data - the data to be pushed in the pass
	 * @returns {this}
	 */

	nfc(data: schema.NFC): this {
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

	private _sign(manifest: { [key: string]: string }): Buffer {
		const signature = forge.pkcs7.createSignedData();

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

	private _patch(passCoreBuffer: Buffer): Buffer {
		const passFile = JSON.parse(passCoreBuffer.toString());

		if (Object.keys(this._props).length) {
			/*
			 * We filter the existing (in passFile) and non-valid keys from
			 * the below array keys that accept rgb values
			 * and then delete it from the passFile.
			 */

			["backgroundColor", "foregroundColor", "labelColor"]
				.filter(v => this._props[v] && !isValidRGB(this._props[v]))
				.forEach(v => delete this._props[v]);

			Object.keys(this._props).forEach(prop => {
				if (passFile[prop] && passFile[prop] instanceof Array) {
					passFile[prop] = [ ...passFile[prop], ...this._props[prop] ];
				} else if (passFile[prop] && passFile[prop] instanceof Object) {
					passFile[prop] = { ...passFile[prop], ...this._props[prop] };
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

	set transitType(value: string) {
		if (!schema.isValid(value, "transitType")) {
			genericDebug(formatMessage("TRSTYPE_NOT_VALID", value));
			this[transitType] = this[transitType] || "";
			return;
		}

		this[transitType] = value;
	}

	get transitType(): string {
		return this[transitType];
	}
}

/**
 * Automatically generates barcodes for all the types given common info
 *
 * @method barcodesFromUncompleteData
 * @params message - the content to be placed inside "message" field
 * @return Array of barcodeDict compliant
 */

function barcodesFromUncompleteData(message: string): schema.Barcode[] {
	if (!(message && typeof message === "string")) {
		return [];
	}

	return [
		"PKBarcodeFormatQR",
		"PKBarcodeFormatPDF417",
		"PKBarcodeFormatAztec",
		"PKBarcodeFormatCode128"
	].map(format => schema.getValidated({ format, message }, "barcode"));
}
