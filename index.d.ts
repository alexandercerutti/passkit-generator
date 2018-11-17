import { Stream } from "stream";

export declare class Pass {
	constructor(options: Schema.Instance);

	public transitType: "PKTransitTypeAir" | "PKTransitTypeBoat" | "PKTransitTypeBus" | "PKTransitTypeGeneric" | "PKTransitTypeTrain";
	public headerFields: FieldContainer;
	public primaryFields: FieldContainer;
	public secondaryFields: FieldContainer;
	public auxiliaryFields: FieldContainer;
	public backFields: FieldContainer;

	/**
	 * Generates a Stream of a zip file using the infos passed through overrides or methods.
	 * (MIME: `application/vnd.apple.pkpass`)
	 */
	generate(): Promise<Stream>;

	/**
	 * Generates pass.strings translation files in the specified language
	 * @param lang - lang in ISO 3166 alpha-2 format (e.g. `en` or `en-US`);
	 * @param translations - Object in format `{ "placeholder" : "translated-text" }`
	 * @see https://apple.co/2KOv0OW
	 */
	localize(lang: string, translations: Object): this;

	/**
	 * Sets pass expiration date
	 * @param date - A date in the format you want (see "format")
	 * @param format - A custom date format. If `undefined`, the date will be parsed in the following formats: `MM-DD-YYYY`, `MM-DD-YYYY hh:mm:ss`, `DD-MM-YYYY`, `DD-MM-YYYY hh:mm:ss`.
	*/
	expiration(date: string, format?: string | string[]): this;

	/** Generates a voided pass. Useful for backend pass updates. */
	void(): this;

	/**
	 * Sets relevance for pass (conditions to appear in the lockscren).
	 * @param type - must be `beacons`, `locations`, `maxDistance` or `relevantDate`
	 * @param data - if object, will be treated as one-element array
	 * @param relevanceDateFormat - custom format to be used in case of "relevatDate" as type. Otherwise the date will be parsed in the following formats: `MM-DD-YYYY`, `MM-DD-YYYY hh:mm:ss`, `DD-MM-YYYY`, `DD-MM-YYYY hh:mm:ss`.
	 */
	relevance(type: Schema.RelevanceType, data: string | Schema.Location | Schema.Location[] | Schema.Beacon | Schema.Beacon[], relevanceDateFormat?: string): SuccessfulOperations;

	/**
	 * Adds barcode to the pass. If data is an Object, will be treated as one-element array.
	 * @param data - data to be used to generate a barcode. If string, Barcode will contain structures for all the supported types and `data` will be used message and altText.
	 * @see https://apple.co/2C74kbm
	 */
	barcode(data: Schema.Barcode | Schema.Barcode[] | string): BarcodeInterfaces;

	/**
	 * Sets nfc infos for the pass
	 * @param data - NFC data
	 * @see https://apple.co/2wTxiaC
	 */
	nfc(...data: Schema.NFC[]): this;

	/**
	 * Sets resources to be downloaded right inside
	 * the pass archive.
	 * @param resource - url
	 * @param name - name to be used inside the archive
	 * @returns this;
	 */

	load(resource, name): this;
}

declare class FieldContainer {
	push(...fields: Schema.Field[]): number;
	pop(amount?: number): undefined | number;
}

interface BarcodeInterfaces extends BarcodeSuccessfulOperations {
	autocomplete: () => void | BarcodeSuccessfulOperations
}

interface BarcodeSuccessfulOperations extends SuccessfulOperations {
	backward: (format: null | string) => void | ThisType<Pass>
}

interface SuccessfulOperations extends ThisType<Pass> {
	length: number
}

declare namespace Schema {
	type DataDetectorType = "PKDataDetectorTypePhoneNumber" | "PKDataDetectorTypeLink" | "PKDataDetectorTypeAddress" | "PKDataDetectorTypeCalendarEvent";
	type TextAlignment = "PKTextAlignmentLeft" | "PKTextAlignmentCenter" | "PKTextAlignmentRight" | "PKTextAlignmentNatural";
	type DateTimeStyle = "PKDateStyleNone" | "PKDateStyleShort" | "PKDateStyleMedium" | "PKDateStyleLong" | "PKDateStyleFull";
	type NumberStyle = "PKNumberStyleDecimal" | "PKNumberStylePercent" | "PKNumberStyleScientific" | "PKNumberStyleSpellOut";
	type BarcodeFormat = "PKBarcodeFormatQR" | "PKBarcodeFormatPDF417" | "PKBarcodeFormatAztec" | "PKBarcodeFormatCode128";
	type RelevanceType = "beacons" | "locations" | "maxDistance" | "relevantDate";

	interface Instance {
		model: string,
		certificates: {
			wwdr: string,
			signerCert: string,
			signerKey: {
				keyFile: string,
				passphrase: string
			}
		},
		overrides: SupportedOptions,
		shouldOverwrite?: boolean
	}

	interface SupportedOptions {
		serialNumber?: string,
		userInfo?: Object | any[],
		webServiceURL?: string,
		authenticationToken?: string,
		backgroundColor?: string,
		foregroundColor?: string,
		labelColor?: string,
		groupingIdentifier?: string,
		suppressStripShine?: boolean
	}

	interface Field {
		attributedValue?: string,
		changeMessage?: string,
		dataDetectorType?: DataDetectorType[],
		label?: string,
		textAlignment?: TextAlignment,
		key: string,
		value: string | number,
		dateStyle?: DateTimeStyle,
		ignoreTimeZone?: boolean,
		isRelative?: boolean,
		timeStyle?: DateTimeStyle,
		currencyCode?: string,
		numberStyle?: NumberStyle
	}

	interface Beacon {
		major?: number,
		minor?: number,
		proximityUUID: string,
		relevantText?: string
	}

	interface Location {
		altitude?: number,
		latitude: number,
		longitude: number,
		relevantText?: string
	}

	interface NFC {
		message: string,
		encryptionPublicKey?: string
	}

	interface Barcode {
		altText?: string,
		messageEncoding?: string,
		format: BarcodeFormat,
		message: string
	}
}
