import FieldsArray from "./FieldsArray";
import Bundle, { filesSymbol } from "./Bundle";
import * as Schemas from "./schemas";
import * as Signature from "./Signature";
import * as Strings from "./StringsUtils";
import { getModelFolderContents } from "./parser";
import { Stream } from "stream";
import { processDate } from "./utils";

/** Exporting for tests specs */
export const propsSymbol = Symbol("props");
export const localizationSymbol = Symbol("pass.l10n");
export const fieldKeysPoolSymbol = Symbol("fieldKeysPoolSymbol");
export const importMetadataSymbol = Symbol("import.pass.metadata");
export const createManifestSymbol = Symbol("pass.manifest");
export const closePassSymbol = Symbol("pass.close");
export const passTypeSymbol = Symbol("pass.type");
export const certificatesSymbol = Symbol("pass.certificates");

export default class PKPass extends Bundle {
	private [certificatesSymbol]: Schemas.CertificatesSchema;
	private [fieldKeysPoolSymbol] = new Set<string>();
	private [propsSymbol]: Schemas.PassProps = {};
	private [localizationSymbol]: {
		[lang: string]: {
			[placeholder: string]: string;
		};
	} = {};
	public [passTypeSymbol]: Schemas.PassTypesProps = undefined;

	/**
	 * Either create a pass from another one
	 * or a disk path.
	 *
	 * @param source
	 * @returns
	 */

	static async from<S extends PKPass | Schemas.Template>(
		source: S,
		additionalProps: S extends PKPass
			? Schemas.OverridablePassProps
			: never,
	): Promise<PKPass> {
		let certificates: Schemas.CertificatesSchema = undefined;
		let buffers: Schemas.FileBuffers = undefined;
		let props: Schemas.OverridablePassProps = {};

		if (!source) {
			throw new TypeError(
				`Cannot create PKPass from source: source is '${source}'`,
			);
		}

		if (source instanceof PKPass) {
			/** Cloning is happening here */
			certificates = source[certificatesSymbol];
			buffers = {};

			const buffersEntries = Object.entries(source[filesSymbol]);

			/** Cloning all the buffers to prevent unwanted edits */
			for (let i = 0; i < buffersEntries.length; i++) {
				const [fileName, contentBuffer] = buffersEntries[i];

				buffers[fileName] = Buffer.alloc(contentBuffer.length);
				contentBuffer.copy(buffers[fileName]);
			}

			/**
			 * Moving props to pass.json instead of overrides
			 * because many might get excluded when passing
			 * through validation
			 */

			buffers["pass.json"] = Buffer.from(
				JSON.stringify(source[propsSymbol]),
			);
		} else {
			Schemas.assertValidity(Schemas.Template, source);

			buffers = await getModelFolderContents(source.model);
			certificates = source.certificates;
			props = Schemas.validate(Schemas.OverridablePassProps, props);
		}

		if (additionalProps && Object.keys(additionalProps).length) {
			Object.assign(
				props,
				Schemas.validate(Schemas.OverridablePassProps, additionalProps),
			);
		}

		return new PKPass(buffers, certificates, props);
	}

	/**
	 * Creates a Bundle made of PKPass to be distributed
	 * as a `.pkpasses` zip file. Returns a Bundle instance
	 * so it can be outputted both as stream or as a buffer.
	 *
	 * Using this will freeze all the instances passed as
	 * parameter.
	 *
	 * Throws if not all the files are instance of PKPass.
	 *
	 * @param passes
	 */

	static async pack(...passes: PKPass[]): Promise<Bundle> {
		if (!passes.every((pass) => pass instanceof PKPass)) {
			throw new Error(
				"Cannot pack passes. Only PKPass instances allowed",
			);
		}

		const buffers = await Promise.all(
			passes.map((pass) => pass.getAsBuffer()),
		);

		const [bundle, freezeBundle] = Bundle.freezable(
			"application/vnd.apple.pkpasses",
		);

		for (let i = 0; i < buffers.length; i++) {
			bundle.addBuffer(`packed-pass-${i + 1}.pkpass`, buffers[i]);
		}

		freezeBundle();

		return bundle;
	}

	// **************** //
	// *** INSTANCE *** //
	// **************** //

	constructor(
		buffers: Schemas.FileBuffers,
		certificates: Schemas.CertificatesSchema,
		props: Schemas.OverridablePassProps,
	) {
		super("application/vnd.apple.pkpass");

		const buffersEntries = Object.entries(buffers);

		for (
			let i = buffersEntries.length, buffer: [string, Buffer];
			(buffer = buffersEntries[--i]);

		) {
			const [fileName, contentBuffer] = buffer;
			this.addBuffer(fileName, contentBuffer);
		}

		/** Overrides validation and pushing in props */
		const overridesValidation = Schemas.validate(
			Schemas.OverridablePassProps,
			props,
		);

		Object.assign(this[propsSymbol], overridesValidation);
		this.certificates = certificates;
	}

	/**
	 * Allows changing the certificates, if needed.
	 * They are actually expected to be received in
	 * the constructor, but they can get overridden
	 * here for whatever purpose.
	 *
	 * When using this setter, all certificates are
	 * expected to be received, or an exception will
	 * be thrown.
	 *
	 * @param certs
	 */

	public set certificates(certs: Schemas.CertificatesSchema) {
		Schemas.assertValidity(Schemas.CertificatesSchema, certs);
		this[certificatesSymbol] = certs;
	}

	/**
	 * Allows getting an image of the props
	 * that are composing your pass instance.
	 */

	public get props(): Readonly<Schemas.PassProps> {
		return freezeRecusive(this[propsSymbol]);
	}

	/**
	 * Allows setting a transitType property
	 * for a boardingPass. Throws an error if
	 * the current type is not a boardingPass.
	 *
	 * @param value
	 */

	public set transitType(value: Schemas.TransitType) {
		if (!this[propsSymbol].boardingPass) {
			throw new TypeError(
				"Cannot set transitType on a pass with type different from 'boardingPass'.",
			);
		}

		Schemas.assertValidity(Schemas.TransitType, value);
		this[propsSymbol]["boardingPass"].transitType = value;
	}

	/**
	 * Allows getting the current transitType
	 * from pass props
	 */

	public get transitType() {
		return this[propsSymbol]["boardingPass"]?.transitType;
	}

	/**
	 * Allows accessing to primaryFields object.
	 *
	 * It will (automatically) throw an error if
	 * no valid pass.json has been parsed yet or,
	 * anyway, if it has not a valid type.
	 */

	public get primaryFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].primaryFields;
	}

	/**
	 * Allows accessing to secondaryFields object
	 *
	 * It will (automatically) throw an error if
	 * no valid pass.json has been parsed yet or,
	 * anyway, if it has not a valid type.
	 */

	public get secondaryFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].secondaryFields;
	}

	/**
	 * Allows accessing to auxiliaryFields object
	 *
	 * It will (automatically) throw an error if
	 * no valid pass.json has been parsed yet or,
	 * anyway, if it has not a valid type.
	 */

	public get auxiliaryFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].auxiliaryFields;
	}

	/**
	 * Allows accessing to headerFields object
	 *
	 * It will (automatically) throw an error if
	 * no valid pass.json has been parsed yet or,
	 * anyway, if it has not a valid type.
	 */

	public get headerFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].headerFields;
	}

	/**
	 * Allows accessing to backFields object
	 *
	 * It will (automatically) throw an error if
	 * no valid pass.json has been parsed yet or,
	 * anyway, if it has not a valid type.
	 */

	public get backFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].backFields;
	}

	/**
	 * Allows setting a pass type.
	 *
	 * **Warning**: setting a type with this setter,
	 * will reset all the imported or manually
	 * setted fields (primaryFields, secondaryFields,
	 * headerFields, auxiliaryFields, backFields)
	 */

	public set type(type: Schemas.PassTypesProps) {
		Schemas.assertValidity(Schemas.PassType, type);

		if (this.type) {
			/**
			 * Removing reference to previous type and its content because
			 * we might have some differences between types. It is way easier
			 * to reset everything instead of making checks.
			 */

			this[propsSymbol][this.type] = undefined;
		}

		this[passTypeSymbol] = type;
		this[propsSymbol][this[passTypeSymbol]] = {
			headerFields /******/: new FieldsArray(this[fieldKeysPoolSymbol]),
			primaryFields /*****/: new FieldsArray(this[fieldKeysPoolSymbol]),
			secondaryFields /***/: new FieldsArray(this[fieldKeysPoolSymbol]),
			auxiliaryFields /***/: new FieldsArray(this[fieldKeysPoolSymbol]),
			backFields /********/: new FieldsArray(this[fieldKeysPoolSymbol]),
			transitType: undefined,
		};
	}

	public get type(): Schemas.PassTypesProps | undefined {
		return this[passTypeSymbol] ?? undefined;
	}

	// **************************** //
	// *** ASSETS SETUP METHODS *** //
	// **************************** //

	/**
	 * Allows adding a new asset inside the pass / bundle;
	 * If an empty buffer is passed, it won't be added to
	 * the bundle.
	 *
	 * `manifest.json` and `signature` files will be ignored.
	 *
	 * If a `pass.json` is passed to this method (and it has
	 * not been added previously), it will be read, validated
	 * and merged in the current instance. Its properties
	 * will overwrite the ones setted through methods.
	 *
	 * If a `pass.strings` file is passed, it will be read, parsed
	 * and merged with the translations added previously.
	 * Comments will be ignored.
	 *
	 * @param pathName
	 * @param buffer
	 */

	public addBuffer(pathName: string, buffer: Buffer): void {
		if (!buffer) {
			return;
		}

		if (/manifest|signature/.test(pathName)) {
			return;
		}

		if (/pass\.json/.test(pathName)) {
			if (this[filesSymbol]["pass.json"]) {
				/**
				 * Ignoring any further addition. In a
				 * future we might consider merging instead
				 */
				return;
			}

			this[importMetadataSymbol](
				validateJSONBuffer(buffer, Schemas.PassProps),
			);

			/**
			 * Adding an empty buffer just for reference
			 * that we received a valid pass.json file.
			 * It will be reconciliated in export phase.
			 */

			return super.addBuffer(pathName, Buffer.alloc(0));
		}

		if (/personalization\.json/.test(pathName)) {
			/**
			 * We are still allowing `personalizationLogo@XX.png`
			 * to be added to the bundle, but we'll delete it
			 * once the pass is getting closed, if needed.
			 */

			try {
				validateJSONBuffer(buffer, Schemas.Personalization);
			} catch (err) {
				console.warn(
					"Personalization.json file has been omitted as invalid.",
				);
				return;
			}

			return super.addBuffer(pathName, buffer);
		}

		/**
		 * If a new pass.strings file is added, we want to
		 * prevent it from being merged and, instead, save
		 * its translations for later
		 */

		const translationsFileRegexp =
			/(?<lang>[a-zA-Z-]{2,}).lproj\/pass\.strings/;

		let match: RegExpMatchArray;

		if ((match = pathName.match(translationsFileRegexp))) {
			const [, lang] = match;

			const parsedTranslations = Strings.parse(buffer).translations;

			if (!parsedTranslations.length) {
				return;
			}

			Object.assign(
				(this[localizationSymbol][lang] ??= {}),
				Object.fromEntries(parsedTranslations),
			);

			return;
		}

		return super.addBuffer(pathName, buffer);
	}

	/**
	 * Given data from a pass.json, reads them to bring them
	 * into the current pass instance.
	 *
	 * **Warning**: if this file contains a type (boardingPass,
	 * coupon, and so on), it will replace the current one,
	 * causing, therefore, the destroy of the fields added
	 * previously.
	 *
	 * @param data
	 */

	private [importMetadataSymbol](data: Schemas.PassProps) {
		const possibleTypes = [
			"boardingPass",
			"coupon",
			"eventTicket",
			"storeCard",
			"generic",
		] as Schemas.PassTypesProps[];

		const type = possibleTypes.find((type) => Boolean(data[type]));

		const {
			boardingPass,
			coupon,
			storeCard,
			generic,
			eventTicket,
			...otherPassData
		} = data;

		if (Object.keys(this[propsSymbol]).length) {
			console.warn(
				"The imported pass.json's properties will be joined with the current setted props. You might lose some data.",
			);
		}

		Object.assign(this[propsSymbol], otherPassData);

		if (!type) {
			if (!this[passTypeSymbol]) {
				console.warn(
					"Cannot find a valid type in pass.json. You won't be able to set fields until you won't set explicitly one.",
				);
			}
		} else {
			this.type = type;

			const {
				headerFields = [],
				primaryFields = [],
				secondaryFields = [],
				auxiliaryFields = [],
				backFields = [],
			} = data[type];

			this.headerFields.push(...headerFields);
			this.primaryFields.push(...primaryFields);
			this.secondaryFields.push(...secondaryFields);
			this.auxiliaryFields.push(...auxiliaryFields);
			this.backFields.push(...backFields);
		}
	}

	/**
	 * Creates the manifest starting from files
	 * added to the bundle
	 */

	private [createManifestSymbol](): Buffer {
		const manifest = Object.entries(this[filesSymbol]).reduce<{
			[key: string]: string;
		}>(
			(acc, [fileName, buffer]) => ({
				...acc,
				[fileName]: Signature.createHash(buffer),
			}),
			{},
		);

		return Buffer.from(JSON.stringify(manifest));
	}

	/**
	 * Applies the last validation checks against props,
	 * applies the props to pass.json and creates l10n
	 * files and folders and creates manifest and
	 * signature files
	 */

	private [closePassSymbol](
		__test_disable_manifest_signature_generation__: boolean = false,
	) {
		const fileNames = Object.keys(this[filesSymbol]);

		const passJson = Buffer.from(JSON.stringify(this[propsSymbol]));
		super.addBuffer("pass.json", passJson);

		const ICON_REGEX = /icon(?:@\d{1}x)?/;
		if (!fileNames.some((fileName) => ICON_REGEX.test(fileName))) {
			console.warn(
				"At least one icon file is missing in your bundle. Your pass won't be openable by any Apple Device.",
			);
		}

		// *********************************** //
		// *** LOCALIZATION FILES CREATION *** //
		// *********************************** //

		const localizationEntries = Object.entries(this[localizationSymbol]);

		for (
			let i = localizationEntries.length,
				entry: [string, { [key: string]: string }];
			(entry = localizationEntries[--i]);

		) {
			const [lang, translations] = entry;

			const stringsFile = Strings.create(translations);

			if (stringsFile.length) {
				super.addBuffer(`${lang}.lproj/pass.strings`, stringsFile);
			}
		}

		// *********************** //
		// *** PERSONALIZATION *** //
		// *********************** //

		const meetsPersonalizationRequirements = Boolean(
			this[propsSymbol]["nfc"] &&
				this[filesSymbol]["personalization.json"] &&
				fileNames.find((file) =>
					/personalizationLogo@(?:.{2})/.test(file),
				),
		);

		if (!meetsPersonalizationRequirements) {
			/**
			 * Looking for every personalization file
			 * and removing it
			 */

			for (let i = 0; i < fileNames.length; i++) {
				if (/personalization/.test(fileNames[i])) {
					console.warn(
						`Personalization file '${fileNames[i]}' have been removed from the bundle as the requirements for personalization are not met.`,
					);

					delete this[filesSymbol][fileNames[i]];
				}
			}
		}

		// ****************************** //
		// *** SIGNATURE AND MANIFEST *** //
		// ****************************** //

		if (__test_disable_manifest_signature_generation__) {
			return;
		}

		const manifestBuffer = this[createManifestSymbol]();
		super.addBuffer("manifest.json", manifestBuffer);

		const signatureBuffer = Signature.create(
			manifestBuffer,
			this[certificatesSymbol],
		);
		super.addBuffer("signature", signatureBuffer);
	}

	// ************************* //
	// *** EXPORTING METHODS *** //
	// ************************* //

	/**
	 * Exports the pass as a zip buffer. When this method
	 * is invoked, the bundle will get frozen and, thus,
	 * no files will be allowed to be added any further.
	 *
	 * @returns
	 */

	public async getAsBuffer(): Promise<Buffer> {
		if (!this.isFrozen) {
			this[closePassSymbol]();
		}

		return super.getAsBuffer();
	}

	/**
	 * Exports the pass as a zip stream. When this method
	 * is invoked, the bundle will get frozen and, thus,
	 * no files will be allowed to be added any further.
	 *
	 * @returns
	 */

	public getAsStream(): Stream {
		if (!this.isFrozen) {
			this[closePassSymbol]();
		}

		return super.getAsStream();
	}

	// ************************** //
	// *** DATA SETUP METHODS *** //
	// ************************** //

	/**
	 * Allows to specify a language to be added to the
	 * final bundle, along with some optionals translations.
	 *
	 * If the language already exists, translations will be
	 * merged with the existing ones.
	 *
	 * Setting `translations` to `null`, fully deletes a language
	 * and its translations.
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/creating_the_source_for_a_pass#3736718
	 * @param lang
	 * @param translations
	 */

	public localize(
		lang: string,
		translations?: { [key: string]: string } | null,
	) {
		if (typeof lang !== "string") {
			throw new TypeError(
				`Cannot set localization. Expected a string for 'lang' but received a ${typeof lang}`,
			);
		}

		if (translations === null) {
			delete this[localizationSymbol][lang];
			return;
		}

		this[localizationSymbol][lang] ??= {};

		if (typeof translations === "object" && !Array.isArray(translations)) {
			Object.assign(this[localizationSymbol][lang], translations);
		}
	}

	/**
	 * Allows to specify an expiration date for the pass.
	 *
	 * @param date
	 * @returns
	 */

	public setExpirationDate(date: Date | null) {
		if (date === null) {
			delete this[propsSymbol]["expirationDate"];
			return;
		}

		try {
			this[propsSymbol]["expirationDate"] = processDate(date);
		} catch (err) {
			throw new TypeError(
				`Cannot set expirationDate. Invalid date ${date}`,
			);
		}
	}

	/**
	 * Allows setting some beacons the OS should
	 * react to and show this pass.
	 *
	 * Pass `null` to remove them at all.
	 *
	 * @example
	 * ```ts
	 *		PKPassInstance.setBeacons(null)
	 *		PKPassInstance.setBeacons({
	 *			proximityUUID: "00000-000000-0000-00000000000",
	 *		});
	 * ```
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/pass/beacons
	 * @param beacons
	 * @returns
	 */

	public setBeacons(beacons: null): void;
	public setBeacons(...beacons: Schemas.Beacon[]): void;
	public setBeacons(...beacons: (Schemas.Beacon | null)[]) {
		if (beacons[0] === null) {
			delete this[propsSymbol]["beacons"];
			return;
		}

		this[propsSymbol]["beacons"] = Schemas.filterValid(
			Schemas.Beacon,
			beacons,
		);
	}

	/**
	 * Allows setting some locations the OS should
	 * react to and show this pass.
	 *
	 * Pass `null` to remove them at all.
	 *
	 * @example
	 * ```ts
	 *		PKPassInstance.setLocations(null)
	 *		PKPassInstance.setLocations({
	 *			latitude: 0.5333245342
	 *			longitude: 0.2135332252
	 *		});
	 * ```
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/pass/locations
	 * @param locations
	 * @returns
	 */

	public setLocations(locations: null): void;
	public setLocations(...locations: Schemas.Location[]): void;
	public setLocations(...locations: (Schemas.Location | null)[]): void {
		if (locations[0] === null) {
			delete this[propsSymbol]["locations"];
			return;
		}

		this[propsSymbol]["locations"] = Schemas.filterValid(
			Schemas.Location,
			locations,
		);
	}

	/**
	 * Allows setting a relevant date in which the OS
	 * should show this pass.
	 *
	 * @param date
	 */

	public setRelevantDate(date: Date): void {
		if (date === null) {
			delete this[propsSymbol]["relevantDate"];
			return;
		}

		try {
			this[propsSymbol]["relevantDate"] = processDate(date);
		} catch (err) {
			throw new TypeError(
				`Cannot set relevantDate. Invalid date ${date}`,
			);
		}
	}

	/**
	 * Allows to specify some barcodes formats.
	 * As per the current specifications, only the first
	 * will be shown to the user, without any possibility
	 * to change it.
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/pass/barcodes
	 * @param barcodes
	 * @returns
	 */

	public setBarcodes(barcodes: null): void;
	public setBarcodes(message: string): void;
	public setBarcodes(...barcodes: Schemas.Barcode[]): void;
	public setBarcodes(...barcodes: (Schemas.Barcode | string | null)[]): void {
		if (!barcodes.length) {
			return;
		}

		if (barcodes[0] === null) {
			delete this[propsSymbol]["barcodes"];
			return;
		}

		let finalBarcodes: Schemas.Barcode[];

		if (typeof barcodes[0] === "string") {
			/**
			 * A string has been received instead of objects. We can
			 * only auto-fill them all with the same data.
			 */

			const supportedFormats: Array<Schemas.BarcodeFormat> = [
				"PKBarcodeFormatQR",
				"PKBarcodeFormatPDF417",
				"PKBarcodeFormatAztec",
				"PKBarcodeFormatCode128",
			];

			finalBarcodes = supportedFormats.map((format) =>
				Schemas.validate(Schemas.Barcode, {
					format,
					message: barcodes[0],
				} as Schemas.Barcode),
			);
		} else {
			finalBarcodes = Schemas.filterValid(
				Schemas.Barcode,
				barcodes as Schemas.Barcode[],
			);

			if (!finalBarcodes.length) {
				throw new TypeError(
					"Expected Schema.Barcode in setBarcodes but no one is valid.",
				);
			}
		}

		this[propsSymbol]["barcodes"] = finalBarcodes;
	}

	/**
	 * Allows to specify details to make this, an
	 * NFC-capable pass.
	 *
	 * Pass `null` as parameter to remove it at all.
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/pass/nfc
	 * @param data
	 * @returns
	 */

	public setNFC(nfc: Schemas.NFC | null): void {
		if (nfc === null) {
			delete this[propsSymbol]["nfc"];
			return;
		}

		this[propsSymbol]["nfc"] =
			Schemas.validate(Schemas.NFC, nfc) ?? undefined;
	}
}

function freezeRecusive(object: Object) {
	const objectCopy = {};
	const objectEntries = Object.entries(object);

	for (let i = 0; i < objectEntries.length; i++) {
		const [key, value] = objectEntries[i];

		if (value && typeof value === "object") {
			if (Array.isArray(value)) {
				objectCopy[key] = value.slice();

				for (let j = 0; j < value.length; j++) {
					objectCopy[key][j] = freezeRecusive(value[j]);
				}
			} else {
				objectCopy[key] = freezeRecusive(value);
			}
		} else {
			objectCopy[key] = value;
		}
	}

	return Object.freeze(objectCopy);
}

function validateJSONBuffer(
	buffer: Buffer,
	schema: Parameters<typeof Schemas.validate>[0],
) {
	let contentAsJSON: unknown;

	try {
		contentAsJSON = JSON.parse(buffer.toString("utf8"));
	} catch (err) {
		throw new TypeError("Cannot validate Pass.json: invalid JSON");
	}

	return Schemas.validate(schema, contentAsJSON);
}
