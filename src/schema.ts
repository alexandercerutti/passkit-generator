import Joi from "joi";
import debug from "debug";

const schemaDebug = debug("Schema");

export interface Certificates {
	wwdr?: string;
	signerCert?: string;
	signerKey?: {
		keyFile: string;
		passphrase?: string;
	};
	_raw?: Certificates;
}

export interface FactoryOptions {
	model: { [key: string]: Buffer } | string;
	certificates: Certificates;
	overrides?: Object;
	shouldOverwrite?: boolean;
}

export interface BundleUnit {
	[key: string]: Buffer;
}

export interface PartitionedBundle {
	bundle: BundleUnit;
	l10nBundle: {
		[key: string]: BundleUnit
	};
}

export interface FinalCertificates {
		wwdr: string;
		signerCert: string;
	signerKey: string;
}

export interface PassInstance {
	model: PartitionedBundle;
	certificates: FinalCertificates;
	overrides?: OverridesSupportedOptions;
}

// ************************************ //
// * JOI Schemas + Related Interfaces * //
// ************************************ //

const certificatesSchema = Joi.object().keys({
	wwdr: Joi.string().required(),
	signerCert: Joi.string().required(),
	signerKey: Joi.alternatives().try(
		Joi.object().keys({
			keyFile: Joi.string().required(),
			passphrase: Joi.string().required(),
		}),
		Joi.string()
	).required()
}).required();

const instance = Joi.object().keys({
	model: Joi.string().required(),
	certificates: certificatesSchema,
	overrides: Joi.object(),
	shouldOverwrite: Joi.boolean()
});

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
}

const supportedOptions = Joi.object().keys({
	serialNumber: Joi.string(),
	description: Joi.string(),
	userInfo: Joi.alternatives(Joi.object().unknown(), Joi.array()),
	// parsing url as set of words and nums followed by dots, optional port and any possible path after
	webServiceURL: Joi.string().regex(/https?:\/\/(?:(?:[a-z0-9]+\.?)+(?::\d)?(?:\/[\S]+)*)*/),
	authenticationToken: Joi.string().token().min(16),
	sharingProhibited: Joi.boolean(),
	backgroundColor: Joi.string().min(10).max(16),
	foregroundColor: Joi.string().min(10).max(16),
	labelColor: Joi.string().min(10).max(16),
	groupingIdentifier: Joi.string(),
	suppressStripShine: Joi.boolean(),
	logoText: Joi.string(),
}).with("webServiceURL", "authenticationToken");


/* For a correct usage of semantics, please refer to https://apple.co/2I66Phk */

interface CurrencyAmount {
	currencyCode: string;
	amount: string;
}

const currencyAmount = Joi.object().keys({
	currencyCode: Joi.string().required(),
	amount: Joi.string().required(),
});

interface PersonNameComponent {
	givenName: string;
	familyName: string;
}

const personNameComponents = Joi.object().keys({
	givenName: Joi.string().required(),
	familyName: Joi.string().required()
});

interface Seat {
	seatSection?: string;
	seatRow?: string;
	seatNumber?: string;
	seatIdentifier?: string;
	seatType?: string;
	seatDescription?: string;
}

const seat = Joi.object().keys({
	seatSection: Joi.string(),
	seatRow: Joi.string(),
	seatNumber: Joi.string(),
	seatIdentifier: Joi.string(),
	seatType: Joi.string(),
	seatDescription: Joi.string()
});

const location = Joi.object().keys({
	latitude: Joi.number().required(),
	longitude: Joi.number().required()
});

interface Semantics {
	totalPrice?: CurrencyAmount;
	duration?: number;
	seats?: Seat[];
	silenceRequested?: boolean;
	departureLocation?: Location;
	destinationLocation?: Location;
	destinationLocationDescription?: Location;
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
	passengetName?: PersonNameComponent;
	membershipProgramName?: string;
	membershipProgramNumber?: string;
	priorityStatus?: string;
	securityScreening?: string;
	flightCode?: string;
	airlineCode?: string;
	flightNumber?: number;
	departureAirportCode?: string;
	departureAirportName?: string;
	destinationTerminal?: string;
	destinationGate?: string;
	departurePlatform?: string;
	departureStationName?: string;
	destinationPlatform?: string;
	destinationStationName?: string;
	carNumber?: string;
	eventName?: string;
	venueName?: string;
	venueLocation?: Location;
	venueEntrance?: string;
	venuePhoneNumber?: string;
	venueRoom?: string;
	eventType?: "PKEventTypeGeneric" | "PKEventTypeLivePerformance" | "PKEventTypeMovie" | "PKEventTypeSports" | "PKEventTypeConference" | "PKEventTypeConvention" | "PKEventTypeWorkshop" | "PKEventTypeSocialGathering";
	eventStartDate?: string;
	eventEndDate?: string;
	artistIDs?: string;
	performerNames?: string[];
	genre?: string;
	leagueName?: string;
	leagueAbbreviation?: string;
	homeTeamLocation?: string;
	homeTeamName?: string;
	homeTeamAbbreviation?: string;
	awayTeamLocation?: string;
	awayTeamName?: string;
	awayTeamAbbreviation?: string;
	sportName?: string;
	balance?: CurrencyAmount;
}

const semantics = Joi.object().keys({
	// All
	totalPrice: currencyAmount,
	// boarding Passes and Events
	duration: Joi.number(),
	seats: Joi.array().items(seat),
	silenceRequested: Joi.boolean(),
	// all boarding passes
	departureLocation: location,
	destinationLocation: location,
	destinationLocationDescription: location,
	transitProvider: Joi.string(),
	vehicleName: Joi.string(),
	vehicleType: Joi.string(),
	originalDepartureDate: Joi.string(),
	currentDepartureDate: Joi.string(),
	originalArrivalDate: Joi.string(),
	currentArrivalDate: Joi.string(),
	originalBoardingDate: Joi.string(),
	currentBoardingDate: Joi.string(),
	boardingGroup: Joi.string(),
	boardingSequenceNumber: Joi.string(),
	confirmationNumber: Joi.string(),
	transitStatus: Joi.string(),
	transitStatuReason: Joi.string(),
	passengetName: personNameComponents,
	membershipProgramName: Joi.string(),
	membershipProgramNumber: Joi.string(),
	priorityStatus: Joi.string(),
	securityScreening: Joi.string(),
	// Airline Boarding Passes
	flightCode: Joi.string(),
	airlineCode: Joi.string(),
	flightNumber: Joi.number(),
	departureAirportCode: Joi.string(),
	departureAirportName: Joi.string(),
	destinationTerminal: Joi.string(),
	destinationGate: Joi.string(),
	// Train and Other Rail Boarding Passes
	departurePlatform: Joi.string(),
	departureStationName: Joi.string(),
	destinationPlatform: Joi.string(),
	destinationStationName: Joi.string(),
	carNumber: Joi.string(),
	// All Event Tickets
	eventName: Joi.string(),
	venueName: Joi.string(),
	venueLocation: location,
	venueEntrance: Joi.string(),
	venuePhoneNumber: Joi.string(),
	venueRoom: Joi.string(),
	eventType: Joi.string().regex(/(PKEventTypeGeneric|PKEventTypeLivePerformance|PKEventTypeMovie|PKEventTypeSports|PKEventTypeConference|PKEventTypeConvention|PKEventTypeWorkshop|PKEventTypeSocialGathering)/),
	eventStartDate: Joi.string(),
	eventEndDate: Joi.string(),
	artistIDs: Joi.string(),
	performerNames: Joi.array().items(Joi.string()),
	genre: Joi.string(),
	// Sport Event Tickets
	leagueName: Joi.string(),
	leagueAbbreviation: Joi.string(),
	homeTeamLocation: Joi.string(),
	homeTeamName: Joi.string(),
	homeTeamAbbreviation: Joi.string(),
	awayTeamLocation: Joi.string(),
	awayTeamName: Joi.string(),
	awayTeamAbbreviation: Joi.string(),
	sportName: Joi.string(),
	// Store Card Passes
	balance: currencyAmount
});

export interface Barcode {
	altText?: string;
	messageEncoding?: string;
	format: string;
	message: string;
}

const barcode = Joi.object().keys({
	altText: Joi.string(),
	messageEncoding: Joi.string().default("iso-8859-1"),
	format: Joi.string().required().regex(/(PKBarcodeFormatQR|PKBarcodeFormatPDF417|PKBarcodeFormatAztec|PKBarcodeFormatCode128)/, "barcodeType"),
	message: Joi.string().required()
});

export interface Field {
	attributedValue?: string | number | Date;
	changeMessage?: string;
	dataDetectorType?: string[];
	label?: string;
	textAlignment?: string;
	key: string;
	value: string | number | Date;
	semantics: Semantics;
	dateStyle?: string;
	ignoreTimeZone?: boolean;
	isRelative?: boolean;
	timeStyle?: string;
	currencyCode?: string;
	numberStyle?: string;
	row?: number;
}

const field = Joi.object().keys({
	attributedValue: Joi.alternatives(Joi.string().allow(""), Joi.number(), Joi.date().iso()),
	changeMessage: Joi.string(),
	dataDetectorType: Joi.array().items(Joi.string().regex(/(PKDataDetectorTypePhoneNumber|PKDataDetectorTypeLink|PKDataDetectorTypeAddress|PKDataDetectorTypeCalendarEvent)/, "dataDetectorType")),
	label: Joi.string().allow(""),
	textAlignment: Joi.string().regex(/(PKTextAlignmentLeft|PKTextAlignmentCenter|PKTextAlignmentRight|PKTextAlignmentNatural)/, "graphic-alignment"),
	key: Joi.string().required(),
	value: Joi.alternatives(Joi.string().allow(""), Joi.number(), Joi.date().iso()).required(),
	semantics,
	// date fields formatters, all optionals
	dateStyle: Joi.string().regex(/(PKDateStyleNone|PKDateStyleShort|PKDateStyleMedium|PKDateStyleLong|PKDateStyleFull)/, "date style"),
	ignoreTimeZone: Joi.boolean(),
	isRelative: Joi.boolean(),
	timeStyle: Joi.string().regex(/(PKDateStyleNone|PKDateStyleShort|PKDateStyleMedium|PKDateStyleLong|PKDateStyleFull)/, "date style"),
	// number fields formatters, all optionals
	currencyCode: Joi.string()
		.when("value", {
			is: Joi.number(),
			otherwise: Joi.string().forbidden()
		}),
	numberStyle: Joi.string()
		.regex(/(PKNumberStyleDecimal|PKNumberStylePercent|PKNumberStyleScientific|PKNumberStyleSpellOut)/)
		.when("value", {
			is: Joi.number(),
			otherwise: Joi.string().forbidden()
		}),
});

export interface Beacon {
	major?: number;
	minor?: number;
	relevantText?: string;
	proximityUUID: string;
}

const beaconsDict = Joi.object().keys({
	major: Joi.number().integer().positive().max(65535).greater(Joi.ref("minor")),
	minor: Joi.number().integer().positive().max(65535).less(Joi.ref("major")),
	proximityUUID: Joi.string().required(),
	relevantText: Joi.string()
});

export interface Location {
	relevantText?: string;
	altitude?: number;
	latitude: number;
	longitude: number;
}

const locationsDict = Joi.object().keys({
	altitude: Joi.number(),
	latitude: Joi.number().required(),
	longitude: Joi.number().required(),
	relevantText: Joi.string()
});

export interface Pass {
	auxiliaryFields: Field[];
	backFields: Field[];
	headerFields: Field[];
	primaryFields: Field[];
	secondaryFields: Field[];
}

const passDict = Joi.object().keys({
	auxiliaryFields: Joi.array().items(Joi.object().keys({
		row: Joi.number().max(1).min(0)
	}).concat(field)),
	backFields: Joi.array().items(field),
	headerFields: Joi.array().items(field),
	primaryFields: Joi.array().items(field),
	secondaryFields: Joi.array().items(field)
});

export type TransitType = "PKTransitTypeAir" | "PKTransitTypeBoat" | "PKTransitTypeBus" | "PKTransitTypeGeneric" | "PKTransitTypeTrain";

const transitType = Joi.string().regex(/(PKTransitTypeAir|PKTransitTypeBoat|PKTransitTypeBus|PKTransitTypeGeneric|PKTransitTypeTrain)/);

export interface NFC {
	message: string;
	encryptionPublicKey?: string;
}

const nfcDict = Joi.object().keys({
	message: Joi.string().required().max(64),
	encryptionPublicKey: Joi.string()
});

// --------- UTILITIES ---------- //

type Schemas = {
	[index: string]: Joi.ObjectSchema | Joi.StringSchema;
};
const schemas: Schemas = {
	instance,
	certificatesSchema,
	barcode,
	field,
	passDict,
	beaconsDict,
	locationsDict,
	transitType,
	nfcDict,
	supportedOptions
};

function resolveSchemaName(name: keyof Schemas) {
	return schemas[name] || undefined;
}

/**
 * Checks if the passed options are compliant with the indicated schema
 * @param {any} opts - options to be checks
 * @param {string} schemaName - the indicated schema (will be converted)
 * @returns {boolean} - result of the check
 */

export function isValid(opts: any, schemaName: keyof Schemas): boolean {
	const resolvedSchema = resolveSchemaName(schemaName);

	if (!resolvedSchema) {
		schemaDebug(`validation failed due to missing or mispelled schema name`);
		return false;
	}

	const validation = Joi.validate(opts, resolvedSchema);

	if (validation.error) {
		schemaDebug(`validation failed due to error: ${validation.error.message}`);
	}

	return !validation.error;
}

/**
 * Executes the validation in verbose mode, exposing the value or an empty object
 * @param {object} opts - to be validated
 * @param {*} schemaName - selected schema
 * @returns {object} the filtered value or empty object
 */

export function getValidated<T extends Object>(opts: any, schemaName: keyof Schemas): T {
	let resolvedSchema = resolveSchemaName(schemaName);
	let validation = Joi.validate(opts, resolvedSchema, { stripUnknown: true });

	if (validation.error) {
		schemaDebug(`Validation failed in getValidated due to error: ${validation.error.message}`);
		return null;
	}

	return validation.value;
}
