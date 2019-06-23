import { Stream } from "stream";

export function createPass(options: Schema.FactoryOptions): Promise<Pass>;

declare class Pass {
	constructor(options: Schema.PassInstance);

	public transitType: "PKTransitTypeAir" | "PKTransitTypeBoat" | "PKTransitTypeBus" | "PKTransitTypeGeneric" | "PKTransitTypeTrain";
	public headerFields: Schema.Field[];
	public primaryFields: Schema.Field[];
	public secondaryFields: Schema.Field[];
	public auxiliaryFields: (Schema.Field & { row: number })[];
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
	localize(lang: string, translations: Object): this;

	/**
	 * Sets expirationDate property to a W3C-formatted date
	 *
	 * @method expiration
	 * @params date
	 * @returns {this}
	 */
	expiration(date: Date): this;

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
	 * @returns Pass instance with `length` property to check the
	 * 	valid structures added
	 */
	beacons(...data: Schema.Beacon[]): PassWithLengthField;

	/**
	 * Sets current pass' relevancy through locations
	 * @param data
	 * @returns Pass instance with `length` property to check the
	 * 	valid structures added
	 */
	locations(...data: Schema.Location[]): PassWithLengthField;

	/**
	 * Sets current pass' relevancy through a date
	 * @param data
	 * @returns {Pass}
	 */
	relevantDate(date: Date): this;

	/**
	 * Adds barcode to the pass. If data is an Object, will be treated as one-element array.
	 * @param first - data to be used to generate a barcode. If string, Barcode will contain structures for all the supported types.
	 * @param data - the other Barcode structures to be used
	 * @see https://apple.co/2C74kbm
	 */
	barcode(first: string | Schema.Barcode, ...data: Schema.Barcode[]): PassWithBarcodeMethods;

	/**
	 * Sets nfc infos for the pass
	 * @param data - NFC data
	 * @see https://apple.co/2wTxiaC
	 */
	nfc(data: Schema.NFC): this;
}

declare interface PassWithLengthField extends Pass {
	length: number;
}

declare interface PassWithBarcodeMethods extends PassWithLengthField {
	backward: (format: Schema.BarcodeFormat | null) => Pass;
	autocomplete: () => Pass;
}

declare namespace Schema {
	type DataDetectorType = "PKDataDetectorTypePhoneNumber" | "PKDataDetectorTypeLink" | "PKDataDetectorTypeAddress" | "PKDataDetectorTypeCalendarEvent";
	type TextAlignment = "PKTextAlignmentLeft" | "PKTextAlignmentCenter" | "PKTextAlignmentRight" | "PKTextAlignmentNatural";
	type DateTimeStyle = "PKDateStyleNone" | "PKDateStyleShort" | "PKDateStyleMedium" | "PKDateStyleLong" | "PKDateStyleFull";
	type NumberStyle = "PKNumberStyleDecimal" | "PKNumberStylePercent" | "PKNumberStyleScientific" | "PKNumberStyleSpellOut";
	type BarcodeFormat = "PKBarcodeFormatQR" | "PKBarcodeFormatPDF417" | "PKBarcodeFormatAztec" | "PKBarcodeFormatCode128";
	type RelevanceType = "beacons" | "locations" | "maxDistance" | "relevantDate";
	type SemanticsEventType = "PKEventTypeGeneric" | "PKEventTypeLivePerformance" | "PKEventTypeMovie" | "PKEventTypeSports" | "PKEventTypeConference" | "PKEventTypeConvention" | "PKEventTypeWorkshop" | "PKEventTypeSocialGathering";

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
