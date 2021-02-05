import { Stream } from "stream";

/**
 * Creates a new Pass instance.
 *
 * @param options Options to be used to create the instance or an Abstract Model reference
 * @param additionalBuffers More buffers (with file name) to be added on runtime (if you are downloading some files from the web)
 * @param abstractMissingData Additional data for abstract models, that might vary from pass to pass.
 */
export declare function createPass(options: Schema.FactoryOptions | AbstractModel, additionalBuffers?: Schema.BundleUnit, abstractMissingData?: Omit<Schema.AbstractFactoryOptions, "model">): Promise<Pass>;

export declare class Pass {
	constructor(options: Schema.PassInstance);

	public transitType: Schema.TransitType;
	public headerFields: Schema.Field[];
	public primaryFields: Schema.Field[];
	public secondaryFields: Schema.Field[];
	public auxiliaryFields: (Schema.Field & { row?: number })[];
	public backFields: Schema.Field[];

	/**
	 * Generates the pass Stream
	 *
	 * @method generate
	 * @return A Stream of the generated pass.
	 */
	generate(): Stream;

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
	localize(lang: string, translations?: {
		[key: string]: string
	}): this;

	/**
	 * Sets expirationDate property to a W3C-formatted date
	 *
	 * @method expiration
	 * @params date
	 * @returns {this}
	 */
	expiration(date: Date | null): this;

	/**
	 * Sets voided property to true
	 *
	 * @method void
	 * @return {this}
	 */
	void(): this;

	/**
	 * Sets current pass' relevancy through beacons
	 * @param data
	 * @returns {Pass}
	 */
	beacons(resetFlag: null): this;
	beacons(...data: Schema.Beacon[]): this;

	/**
	 * Sets current pass' relevancy through locations
	 * @param data
	 * @returns {Pass}
	 */
	locations(resetFlag: null): this;
	locations(...data: Schema.Location[]): this;

	/**
	 * Sets current pass' relevancy through a date
	 * @param data
	 * @returns {Pass}
	 */
	relevantDate(date: Date | null): this;

	/**
	 * Adds barcodes "barcodes" property.
	 * It allows to pass a string to autogenerate all the structures.
	 *
	 * @method barcode
	 * @params first - a structure or the string (message) that will generate
	 * 		all the barcodes
	 * @params data - other barcodes support
	 * @return {this} Improved this with length property and other methods
	 */
	barcodes(resetFlag: null): this;
	barcodes(message: string): this;
	barcodes(...data: Schema.Barcode[]): this;

	/**
	 * Given an index <= the amount of already set "barcodes",
	 * this let you choose which structure to use for retrocompatibility
	 * property "barcode".
	 *
	 * @method barcode
	 * @params format - the format to be used
	 * @return {this}
	 */
	barcode(chosenFormat: Schema.BarcodeFormat | null): this;

	/**
	 * Sets nfc fields in properties
	 *
	 * @method nfc
	 * @params data - the data to be pushed in the pass
	 * @returns {this}
	 * @see https://apple.co/2wTxiaC
	 */
	nfc(data: Schema.NFC | null): this;

	/**
	 * Allows to get the current inserted props;
	 * will return all props from valid overrides,
	 * template's pass.json and methods-inserted ones;
	 *
	 * @returns The properties will be inserted in the pass.
	 */
	readonly props: Readonly<Schema.ValidPass>;
}

/**
 * Creates an abstract model to keep data
 * in memory for future passes creation
 * @param options
 */
export declare function createAbstractModel(options: Schema.AbstractFactoryOptions): Promise<AbstractModel>;

export declare class AbstractModel {
	constructor(options: Schema.AbstractModelOptions);
	readonly certificates: Schema.FinalCertificates;
	readonly bundle: Schema.PartitionedBundle;
	readonly overrides: Schema.OverridesSupportedOptions;
}

declare namespace Schema {
	type DataDetectorType = "PKDataDetectorTypePhoneNumber" | "PKDataDetectorTypeLink" | "PKDataDetectorTypeAddress" | "PKDataDetectorTypeCalendarEvent";
	type TextAlignment = "PKTextAlignmentLeft" | "PKTextAlignmentCenter" | "PKTextAlignmentRight" | "PKTextAlignmentNatural";
	type DateTimeStyle = "PKDateStyleNone" | "PKDateStyleShort" | "PKDateStyleMedium" | "PKDateStyleLong" | "PKDateStyleFull";
	type NumberStyle = "PKNumberStyleDecimal" | "PKNumberStylePercent" | "PKNumberStyleScientific" | "PKNumberStyleSpellOut";
	type BarcodeFormat = "PKBarcodeFormatQR" | "PKBarcodeFormatPDF417" | "PKBarcodeFormatAztec" | "PKBarcodeFormatCode128";
	type SemanticsEventType = "PKEventTypeGeneric" | "PKEventTypeLivePerformance" | "PKEventTypeMovie" | "PKEventTypeSports" | "PKEventTypeConference" | "PKEventTypeConvention" | "PKEventTypeWorkshop" | "PKEventTypeSocialGathering";
	type TransitType = "PKTransitTypeAir" | "PKTransitTypeBoat" | "PKTransitTypeBus" | "PKTransitTypeGeneric" | "PKTransitTypeTrain";

	interface Certificates {
		wwdr?: string;
		signerCert?: string;
		signerKey?: {
			keyFile: string;
			passphrase?: string;
		};
	}

	interface FactoryOptions {
		model: BundleUnit | string;
		certificates: Certificates;
		overrides?: Object;
	}

	interface BundleUnit {
		[key: string]: Buffer;
	}

	interface PartitionedBundle {
		bundle: BundleUnit;
		l10nBundle: {
			[key: string]: BundleUnit
		};
	}

	interface FinalCertificates {
		wwdr: string;
		signerCert: string;
		signerKey: string;
	}

	interface AbstractFactoryOptions extends Omit<FactoryOptions, "certificates"> {
		certificates?: Certificates;
	}

	interface AbstractModelOptions {
		bundle: PartitionedBundle;
		certificates: FinalCertificates;
		overrides?: OverridesSupportedOptions;
	}

	interface PassInstance {
		model: PartitionedBundle;
		certificates: FinalCertificates;
		overrides?: OverridesSupportedOptions;
	}

	interface OverridesSupportedOptions {
		serialNumber?: string;
		description?: string;
		userInfo?: Object | Array<any>;
		webServiceURL?: string;
		authenticationToken?: string;
		sharingProhibited?: boolean;
		backgroundColor?: string;
		foregroundColor?: string;
		labelColor?: string;
		groupingIdentifier?: string;
		suppressStripShine?: boolean;
		maxDistance?: number;
	}

	interface Field {
		attributedValue?: string;
		changeMessage?: string;
		dataDetectorType?: DataDetectorType[];
		label?: string;
		textAlignment?: TextAlignment;
		key: string;
		value: string | number;
		dateStyle?: DateTimeStyle;
		ignoreTimeZone?: boolean;
		isRelative?: boolean;
		timeStyle?: DateTimeStyle;
		currencyCode?: string;
		numberStyle?: NumberStyle;
		semantics?: Semantics;
	}

	interface PassFields {
		auxiliaryFields: Field[];
		backFields: Field[];
		headerFields: Field[];
		primaryFields: Field[];
		secondaryFields: Field[];
	}

	interface ValidPassType {
		boardingPass?: PassFields & { transitType: TransitType };
		eventTicket?: PassFields;
		coupon?: PassFields;
		generic?: PassFields;
		storeCard?: PassFields;
	}

	interface ValidPass extends OverridesSupportedOptions, ValidPassType {
		barcode?: Barcode;
		barcodes?: Barcode[];
		beacons?: Beacon[];
		locations?: Location[];
		maxDistance?: number;
		relevantDate?: string;
		nfc?: NFC;
		expirationDate?: string;
		voided?: boolean;
	}

	interface Beacon {
		major?: number;
		minor?: number;
		proximityUUID: string;
		relevantText?: string;
	}

	interface Location {
		altitude?: number;
		latitude: number;
		longitude: number;
		relevantText?: string;
	}

	interface NFC {
		message: string;
		encryptionPublicKey?: string;
	}

	interface Barcode {
		altText?: string;
		messageEncoding?: string;
		format: BarcodeFormat;
		message: string;
	}

	interface Semantics {
		// All
		totalPrice?: SemanticsCurrencyAmount;
		// boarding Passes and Events
		duration?: number;
		seats?: SemanticsSeat[];
		silenceRequested?: boolean;
		// all boarding passes
		departureLocation?: SemanticsLocation;
		destinationLocation?: SemanticsLocation;
		destinationLocationDescription?: SemanticsLocation;
		transitProvider?: string;
		vehicleName?: string;
		vehicleType?: string;
		originalDepartureDate?: string;
		currentDepartureDate?: string;
		originalArrivalDate?: string;
		currentArrivalDate?: string;
		originalBoardingDate?: string;
		currentBoardingDate?: string;
		boardingGroup?: string;
		boardingSequenceNumber?: string;
		confirmationNumber?: string;
		transitStatus?: string;
		transitStatuReason?: string;
		passengetName?: SemanticsPersonNameComponents;
		membershipProgramName?: string;
		membershipProgramNumber?: string;
		priorityStatus?: string;
		securityScreening?: string;
		// Airline Boarding Passes
		flightCode?: string;
		airlineCode?: string;
		flightNumber?: number;
		departureAirportCode?: string;
		departureAirportName?: string;
		destinationTerminal?: string;
		destinationGate?: string;
		// Train and Other Rail Boarding Passes
		departurePlatform?: string;
		departureStationName?: string;
		destinationPlatform?: string;
		destinationStationName?: string;
		carNumber?: string;
		// All Event Tickets
		eventName?: string;
		venueName?: string;
		venueLocation?: SemanticsLocation;
		venueEntrance?: string;
		venuePhoneNumber?: string;
		venueRoom?: string;
		eventType?: SemanticsEventType;
		eventStartDate?: string;
		eventEndDate?: string;
		artistIDs?: string;
		performerNames?: string[];
		genre?: string;
		// Sport Event Tickets
		leagueName?: string;
		leagueAbbreviation?: string;
		homeTeamLocation?: string;
		homeTeamName?: string;
		homeTeamAbbreviation?: string;
		awayTeamLocation?: string;
		awayTeamName?: string;
		awayTeamAbbreviation?: string;
		sportName?: string;
		// Store Card Passes
		balance?: SemanticsCurrencyAmount;
	}

	interface SemanticsCurrencyAmount {
		currencyCode: string;
		amount: string;
	}

	interface SemanticsPersonNameComponents {
		givenName: string;
		familyName: string;
	}

	interface SemanticsSeat {
		seatSection?: string;
		seatRow?: string;
		seatNumber?: string;
		seatIdentifier?: string;
		seatType?: string;
		seatDescription?: string;
	}

	interface SemanticsLocation {
		latitude: number;
		longitude: number;
	}
}
