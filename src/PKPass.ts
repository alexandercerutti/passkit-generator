import FieldsArray from "../src/fieldsArray";
import { Certificates } from "../src/schemas";
import { default as Bundle, filesSymbol } from "./Bundle";
import { getModelFolderContents } from "./parser";

const fieldKeysPoolSymbol = Symbol("fieldKeysPoolSymbol");

interface NamedBuffers {
	[key: string]: Buffer;
}

type TransitTypes = `PKTransitType${
	| "Air"
	| "Boat"
	| "Bus"
	| "Generic"
	| "Train"}`;

export class PKPass extends Bundle {
	private certificates: Certificates;
	private [fieldKeysPoolSymbol] = new Set<string>();
	public primaryFields /*****/ = new FieldsArray(this[fieldKeysPoolSymbol]);
	public secondaryFields /***/ = new FieldsArray(this[fieldKeysPoolSymbol]);
	public auxiliaryFields /***/ = new FieldsArray(this[fieldKeysPoolSymbol]);
	public headerFields /******/ = new FieldsArray(this[fieldKeysPoolSymbol]);
	public backFields /********/ = new FieldsArray(this[fieldKeysPoolSymbol]);

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

	constructor(buffers: NamedBuffers, certificates: Certificates) {
		super("application/vnd.apple.pkpass");

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
		/**
		 * @TODO implement
		 */

		return undefined;
	}

	/**
	 * Allows setting a transitType property
	 * for a boardingPass
	 *
	 * @param value
	 */

	set transitType(value: TransitTypes) {
		/**
		 * @TODO implement
		 * @TODO validate against schema
		 * @TODO save into props
		 */
	}

	/**
	 * Allows getting the current transitType
	 * from pass props
	 */

	get transitType(): TransitTypes {
		/**
		 * @TODO implement
		 * @TODO read from props
		 */

		return undefined;
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

		super.addBuffer(pathName, buffer);
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

	setExpiration(date: Date | null): this {
		/**
		 * @TODO implement
		 */

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
	 * @param beacons
	 * @returns
	 */

	setBeacons(...beacons: Schemas.Beacon[]): this {
		/**
		 * @TODO implement
		 * @TODO specify a way to get current ones deleted
		 */

		return this;
	}

	/**
	 * Allows setting some locations the OS should
	 * react to and show this pass.
	 *
	 * @param locations
	 * @returns
	 */

	setLocations(...locations: Schemas.Location[]): this {
		/**
		 * @TODO implement
		 * @TODO specify a way to get current ones deleted
		 */

		return this;
	}

	/**
	 * Allows setting a relevant date in which the OS
	 * should show this pass.
	 *
	 * @param date
	 */

	setRelevantDate(date: Date): this {
		/**
		 * @TODO implement
		 */

		return this;
	}

	/**
	 * Allows to specify some barcodes formats.
	 * As per the current specifications, only the first
	 * will be shown to the user, without any possibility
	 * to change it.
	 *
	 * @param barcodes
	 * @returns
	 */

	setBarcodes(...barcodes: Schemas.Barcode[]): this {
		/**
		 * @TODO implement
		 * @TODO implement data completion
		 * @TODO specify a way to get current ones deleted
		 */

		return this;
	}

	/**
	 * Allows to specify details to make this, an
	 * NFC-capable pass.
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/pass/nfc
	 * @param data
	 * @returns
	 */

	setNFCCapability(data: Schemas.NFC): this {
		/**
		 * @TODO implement
		 * @TODO specify a way to get current one deleted
		 */

		return this;
	}
}
