import FieldsArray from "./fieldsArray";
import { Certificates } from "./schemas";
import { default as Bundle, filesSymbol } from "./Bundle";
import { getModelFolderContents } from "./parser";
import * as Schemas from "./schemas";
import { Stream } from "stream";

const fieldKeysPoolSymbol = Symbol("fieldKeysPoolSymbol");
const propsSymbol = Symbol("props");
const importMetadataSymbol = Symbol("import.pass.metadata");
const localizationSymbol = Symbol("pass.l10n");

interface NamedBuffers {
	[key: string]: Buffer;
}

type TransitTypes = `PKTransitType${
	| "Air"
	| "Boat"
	| "Bus"
	| "Generic"
	| "Train"}`;

const LOCALIZED_FILE_REGEX_BASE = "(?<lang>[a-zA-Z-]{2,}).lproj/";

export default class PKPass extends Bundle {
	private certificates: Certificates;
	private [fieldKeysPoolSymbol] = new Set<string>();
	private [propsSymbol]: Schemas.ValidPass = {};
	private [localizationSymbol]: {
		[lang: string]: {
			[placeholder: string]: string;
		};
	} = {};
	public type: string = undefined; /** @TODO change type */

	/**
	 * Either create a pass from another one
	 * or a disk path.
	 *
	 * @param source
	 * @returns
	 */

	static async from(source: PKPass | string): Promise<PKPass> {
		let certificates: Certificates = undefined;
		let buffers: NamedBuffers = undefined;

		if (source instanceof PKPass) {
			/** Cloning is happening here */
			certificates = source.certificates;
			buffers = {};

			const buffersEntries = Object.entries(source[filesSymbol]);

			/** Cloning all the buffers to prevent unwanted edits */
			for (let i = 0; i < buffersEntries.length; i++) {
				const [fileName, contentBuffer] = buffersEntries[i];

				buffers[fileName] = Buffer.from(contentBuffer);
			}
		} else {
			/** Disk model reading is happening here */

			/**
			 * @TODO Rename bundles in something else.
			 * @TODO determine how to use localized files
			 */

			const { bundle, l10nBundle } = await getModelFolderContents(source);

			buffers = bundle;
		}

		return new PKPass(buffers, certificates);
	}

	/**
	 * Creates a Bundle made of PKPass to be distributed
	 * as a `.pkpasses` zip file. Returns a Bundle instance
	 * so it can be outputted both as stream or as a buffer.
	 *
	 * Throws if not all the files are instance of PKPass.
	 *
	 * @TODO test autofreezing
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

		const bundle = Bundle.autoFreezable("application/vnd.apple.pkpasses");

		for (let i = 0; i < buffers.length; i++) {
			bundle.addBuffer(`packed-pass-${i + 1}.pkpass`, buffers[i]);
		}

		return bundle;
	}

	// **************** //
	// *** INSTANCE *** //
	// **************** //

	constructor(buffers: NamedBuffers, certificates: Certificates) {
		super("application/vnd.apple.pkpass");

		/**
		 * @TODO Validate options against Joi Schema
		 */

		const buffersEntries = Object.entries(buffers);

		for (
			let i = buffersEntries.length, buffer: [string, Buffer];
			(buffer = buffersEntries[--i]);

		) {
			const [fileName, contentBuffer] = buffer;
			this.addBuffer(fileName, contentBuffer);
		}
	}

	/**
	 * Allows getting an image of the props
	 * that are composing your pass instance.
	 */

	get props(): Readonly<Schemas.ValidPass> {
		return freezeRecusive(this[propsSymbol]);
	}

	/**
	 * Allows setting a transitType property
	 * for a boardingPass. Throws an error if
	 * the current type is not a boardingPass.
	 *
	 * @param value
	 */

	set transitType(value: TransitTypes) {
		if (!this[propsSymbol].boardingPass) {
			throw new TypeError(
				"Cannot set transitType on a pass with type different from 'boardingPass'.",
			);
		}

		/**
		 * @TODO Make getValidated more explicit in case of error.
		 * @TODO maybe make an automated error.
		 */

		if (!Schemas.getValidated(value, Schemas.TransitType)) {
			throw new TypeError(
				`Cannot set transitType to '${value}': invalid type. Expected one of PKTransitTypeAir, PKTransitTypeBoat, PKTransitTypeBus, PKTransitTypeGeneric, PKTransitTypeTrain.`,
			);
		}

		this[propsSymbol]["boardingPass"].transitType = value;
	}

	/**
	 * Allows getting the current transitType
	 * from pass props
	 */

	get transitType(): TransitTypes {
		return this[propsSymbol]["boardingPass"]?.transitType;
	}

	/**
	 * Allows accessing to primaryFields object.
	 *
	 * It will (automatically) throw an error if
	 * no valid pass.json has been parsed yet or,
	 * anyway, if it has not a valid type.
	 */

	get primaryFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].primaryFields;
	}

	/**
	 * Allows accessing to secondaryFields object
	 *
	 * It will (automatically) throw an error if
	 * no valid pass.json has been parsed yet or,
	 * anyway, if it has not a valid type.
	 */

	get secondaryFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].secondaryFields;
	}

	/**
	 * Allows accessing to auxiliaryFields object
	 *
	 * It will (automatically) throw an error if
	 * no valid pass.json has been parsed yet or,
	 * anyway, if it has not a valid type.
	 */

	get auxiliaryFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].auxiliaryFields;
	}

	/**
	 * Allows accessing to headerFields object
	 *
	 * It will (automatically) throw an error if
	 * no valid pass.json has been parsed yet or,
	 * anyway, if it has not a valid type.
	 */

	get headerFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].headerFields;
	}

	/**
	 * Allows accessing to backFields object
	 *
	 * It will (automatically) throw an error if
	 * no valid pass.json has been parsed yet or,
	 * anyway, if it has not a valid type.
	 */

	get backFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].backFields;
	}

	// **************************** //
	// *** ASSETS SETUP METHODS *** //
	// **************************** //

	/**
	 * Allows adding a new asset inside the pass / bundle;
	 *
	 * @param pathName
	 * @param buffer
	 */

	public addBuffer(pathName: string, buffer: Buffer): void {
		/**
		 * @TODO implement
		 * @TODO exclude pass.json, manifest, signature files
		 */

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

			this[importMetadataSymbol](readPassMetadata(buffer));

			/**
			 * Adding an empty buffer just for reference
			 * that we received a valid pass.json file.
			 * It will be reconciliated in export phase.
			 */

			return super.addBuffer(pathName, Buffer.alloc(0));
		}

		/**
		 * If a new pass.strings file is added, we want to
		 * prevent if from being merged and, instead, save
		 * its translations for later
		 */

		const translationsFileRegexp = new RegExp(
			`${LOCALIZED_FILE_REGEX_BASE}pass.strings`,
		);

		let match: RegExpMatchArray;

		if ((match = pathName.match(translationsFileRegexp))) {
			const [, lang] = match;

			Object.assign(
				(this[localizationSymbol][lang] ??= {}),
				parseStringsFile(buffer),
			);

			return;
		}

		return super.addBuffer(pathName, buffer);
	}

	private [importMetadataSymbol](data: Schemas.ValidPass) {
		const possibleTypes = [
			"boardingPass",
			"coupon",
			"eventTicket",
			"storeCard",
			"generic",
		] as string[]; /** @TODO fix this type */

		this.type = possibleTypes.find((type) => Boolean(data[type]));

		if (!this.type) {
			/**
			 * @TODO improve message
			 */

			throw new Error("Cannot find a valid type in this pass.json");
		}

		this[propsSymbol][this.type] = {
			primaryFields /*****/: new FieldsArray(
				this[fieldKeysPoolSymbol],
				...data[this.type]?.primaryFields,
			),
			secondaryFields /***/: new FieldsArray(
				this[fieldKeysPoolSymbol],
				...data[this.type]?.secondaryFields,
			),
			auxiliaryFields /***/: new FieldsArray(
				this[fieldKeysPoolSymbol],
				...data[this.type]?.auxiliaryFields,
			),
			headerFields /******/: new FieldsArray(
				this[fieldKeysPoolSymbol],
				...data[this.type]?.headerFields,
			),
			backFields /********/: new FieldsArray(
				this[fieldKeysPoolSymbol],
				...data[this.type]?.backFields,
			),
		};
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
		/**
		 * @TODO compile this pass into something usable
		 * @TODO like _patch on old version
		 * @TODO share implementation with getAsStream
		 */

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
		/**
		 * @TODO compile this pass into something usable
		 * @TODO like _patch on old version
		 * @TODO share implementation with getAsBuffer
		 */

		return super.getAsStream();
	}

	// ************************** //
	// *** DATA SETUP METHODS *** //
	// ************************** //

	/**
	 * Allows to specify a language to be added to the
	 * final bundle, along with some optionals / additional
	 * translations.
	 *
	 * If the language already exists in the origin source,
	 * translations will be added to the existing ones.
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/creating_the_source_for_a_pass#3736718
	 * @param lang
	 * @param translations
	 */

	localize(lang: string, translations?: any): this {
		/**
		 * @TODO change translations format
		 * @TODO specify a way to get current ones deleted
		 * @TODO Default languages from source
		 * @TODO print warning if lang is already in selection?
		 */

		return this;
	}

	/**
	 * Allows to specify an expiration date for the pass.
	 *
	 * @param date
	 * @returns
	 */

	setExpirationDate(date: Date | null): this {
		if (date === null) {
			delete this[propsSymbol]["expirationDate"];
			return this;
		}

		const parsedDate = processDate("expirationDate", date);

		if (parsedDate) {
			this[propsSymbol]["expirationDate"] = parsedDate;
		}

		return this;
	}

	/**
	 * Allows to set the Pass directly as voided.
	 * Useful for updates.
	 *
	 * @TODO REMOVE, can be passed in overrides. It doesn't require any validation.
	 * 			It is just a boolean
	 */

	void(): this {
		/**
		 * @TODO implement
		 */

		return this;
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

	setBeacons(beacons: null): this;
	setBeacons(...beacons: Schemas.Beacon[]): this;
	setBeacons(...beacons: (Schemas.Beacon | null)[]): this {
		if (beacons[0] === null) {
			delete this[propsSymbol]["beacons"];
			return this;
		}

		this[propsSymbol]["beacons"] = Schemas.filterValid(
			beacons,
			Schemas.Beacon,
		);

		return this;
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

	setLocations(locations: null): this;
	setLocations(...locations: Schemas.Location[]): this;
	setLocations(...locations: (Schemas.Location | null)[]): this {
		if (locations[0] === null) {
			delete this[propsSymbol]["locations"];
			return this;
		}

		this[propsSymbol]["locations"] = Schemas.filterValid(
			locations,
			Schemas.Location,
		);

		return this;
	}

	/**
	 * Allows setting a relevant date in which the OS
	 * should show this pass.
	 *
	 * @param date
	 */

	setRelevantDate(date: Date): this {
		if (date === null) {
			delete this[propsSymbol]["relevantDate"];
			return this;
		}

		const parsedDate = processDate("relevantDate", date);

		if (parsedDate) {
			this[propsSymbol]["relevantDate"] = parsedDate;
		}

		return this;
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

	setBarcodes(barcodes: null): this;
	setBarcodes(message: string): this;
	setBarcodes(...barcodes: Schemas.Barcode[]): this;
	setBarcodes(...barcodes: (Schemas.Barcode | string | null)[]): this {
		if (!barcodes.length) {
			return this;
		}

		if (barcodes[0] === null) {
			delete this[propsSymbol]["barcodes"];
			return this;
		}

		let finalBarcodes: Schemas.Barcode[];

		if (typeof barcodes[0] === "string") {
			/** A string has been received instead of objects. We can only auto-fill them all with the same data. */

			const supportedFormats: Array<Schemas.BarcodeFormat> = [
				"PKBarcodeFormatQR",
				"PKBarcodeFormatPDF417",
				"PKBarcodeFormatAztec",
				"PKBarcodeFormatCode128",
			];

			finalBarcodes = supportedFormats.map((format) =>
				Schemas.getValidated(
					{ format, message: barcodes[0] } as Schemas.Barcode,
					Schemas.Barcode,
				),
			);
		} else {
			finalBarcodes = Schemas.filterValid(
				barcodes as Schemas.Barcode[],
				Schemas.Barcode,
			);

			if (!finalBarcodes.length) {
				throw new TypeError(
					"Expected Schema.Barcode in setBarcodes but no one is valid.",
				);
			}
		}

		this[propsSymbol]["barcodes"] = finalBarcodes;

		return this;
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

	setNFCCapability(nfc: Schemas.NFC | null): this {
		if (nfc === null) {
			delete this[propsSymbol]["nfc"];
			return this;
		}

		this[propsSymbol]["nfc"] =
			Schemas.getValidated(nfc, Schemas.NFC) ?? undefined;

		return this;
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

function readPassMetadata(buffer: Buffer) {
	try {
		const contentAsJSON = JSON.parse(
			buffer.toString("utf8"),
		) as Schemas.ValidPass;

		const validation = Schemas.getValidated(
			contentAsJSON,
			Schemas.ValidPass,
		);

		/**
		 * @TODO validation.error?
		 */

		if (!validation) {
			throw new Error(
				"Cannot validate pass.json file. Not conformant to",
			);
		}

		return validation;
	} catch (err) {
		console.error(err);
	}
}

function parseStringsFile(buffer: Buffer) {
	const fileAsString = buffer.toString("utf8");
	const translationRowRegex = /"(?<key>.+)"\s+=\s+"(?<value>.+)";\n?/;
	const commentRowRegex = /\/\*\s*(.+)\s*\*\//;

	let translations: [placeholder: string, value: string][] = [];
	let comments: string[] = [];

	let blockStartPoint = 0;
	let blockEndPoint = 0;

	do {
		if (
			/** New Line, new life */
			/\n/.test(fileAsString[blockEndPoint]) ||
			/** EOF  */
			blockEndPoint === fileAsString.length
		) {
			let match: RegExpMatchArray;

			const section = fileAsString.substring(
				blockStartPoint,
				blockEndPoint + 1,
			);

			if ((match = section.match(translationRowRegex))) {
				const {
					groups: { key, value },
				} = match;

				translations.push([key, value]);
			} else if ((match = section.match(commentRowRegex))) {
				const [, content] = match;

				comments.push(content.trimEnd());
			}

			/** Skipping \n and going to the next block. */
			blockEndPoint += 2;
			blockStartPoint = blockEndPoint - 1;
		} else {
			blockEndPoint += 1;
		}
	} while (blockEndPoint <= fileAsString.length);

	return {
		translations,
		comments,
	};
}
