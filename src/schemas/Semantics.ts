import Joi from "joi";

/**
 * For a better description of every single field,
 * please refer to Apple official documentation.
 *
 * @see https://developer.apple.com/documentation/walletpasses/semantictags
 */

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype
 */

declare namespace SemanticTagType {
	interface PersonNameComponents {
		familyName?: string;
		givenName?: string;
		middleName?: string;
		namePrefix?: string;
		nameSuffix?: string;
		nickname?: string;
		phoneticRepresentation?: string;
	}

	interface CurrencyAmount {
		currencyCode?: string; // ISO 4217 currency code
		amount?: string;
	}

	interface Location {
		latitude: number;
		longitude: number;
	}

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */

	interface RelevantDate {
		startDate: string;
		endDate: string;
	}

	interface Seat {
		seatSection?: string;
		seatRow?: string;
		seatNumber?: string;
		seatIdentifier?: string;
		seatType?: string;
		seatDescription?: string;
	}

	interface WifiNetwork {
		password: string;
		ssid: string;
	}
}

const CurrencyAmount = Joi.object<SemanticTagType.CurrencyAmount>().keys({
	currencyCode: Joi.string(),
	amount: Joi.string(),
});

const PersonNameComponent =
	Joi.object<SemanticTagType.PersonNameComponents>().keys({
		givenName: Joi.string(),
		familyName: Joi.string(),
		middleName: Joi.string(),
		namePrefix: Joi.string(),
		nameSuffix: Joi.string(),
		nickname: Joi.string(),
		phoneticRepresentation: Joi.string(),
	});

/**
 * Minimum supported version: iOS 18
 */

const RelevantDate = Joi.object<SemanticTagType.RelevantDate>().keys({
	startDate: Joi.string().required(),
	endDate: Joi.string().required(),
});

const SeatSemantics = Joi.object<SemanticTagType.Seat>().keys({
	seatSection: Joi.string(),
	seatRow: Joi.string(),
	seatNumber: Joi.string(),
	seatIdentifier: Joi.string(),
	seatType: Joi.string(),
	seatDescription: Joi.string(),
});

const LocationSemantics = Joi.object<SemanticTagType.Location>().keys({
	latitude: Joi.number().required(),
	longitude: Joi.number().required(),
});

const WifiNetwork = Joi.object<SemanticTagType.WifiNetwork>().keys({
	password: Joi.string().required(),
	ssid: Joi.string().required(),
});

/**
 * Alphabetical order
 * @see https://developer.apple.com/documentation/walletpasses/semantictags
 */

export interface Semantics {
	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	admissionLevel?: string;

	airlineCode?: string;
	artistIDs?: string[];
	awayTeamAbbreviation?: string;
	awayTeamLocation?: string;
	awayTeamName?: string;

	balance?: SemanticTagType.CurrencyAmount;
	boardingGroup?: string;
	boardingSequenceNumber?: string;

	carNumber?: string;
	confirmationNumber?: string;
	currentArrivalDate?: string;
	currentBoardingDate?: string;
	currentDepartureDate?: string;

	departureAirportCode?: string;
	departureAirportName?: string;
	departureGate?: string;
	departureLocation?: SemanticTagType.Location;
	departureLocationDescription?: string;
	departurePlatform?: string;
	departureStationName?: string;
	departureTerminal?: string;
	destinationAirportCode?: string;
	destinationAirportName?: string;
	destinationGate?: string;
	destinationLocation?: SemanticTagType.Location;
	destinationLocationDescription?: string;
	destinationPlatform?: string;
	destinationStationName?: string;
	destinationTerminal?: string;
	duration?: number;

	eventEndDate?: string;
	eventName?: string;
	eventStartDate?: string;
	eventType?:
		| "PKEventTypeGeneric"
		| "PKEventTypeLivePerformance"
		| "PKEventTypeMovie"
		| "PKEventTypeSports"
		| "PKEventTypeConference"
		| "PKEventTypeConvention"
		| "PKEventTypeWorkshop"
		| "PKEventTypeSocialGathering";

	flightCode?: string;
	flightNumber?: number;

	genre?: string;

	homeTeamAbbreviation?: string;
	homeTeamLocation?: string;
	homeTeamName?: string;
	leagueAbbreviation?: string;
	leagueName?: string;

	membershipProgramName?: string;
	membershipProgramNumber?: string;

	originalArrivalDate?: string;
	originalBoardingDate?: string;
	originalDepartureDate?: string;

	passengerName?: SemanticTagType.PersonNameComponents;
	performerNames?: string[];
	priorityStatus?: string;

	relevantDates?: SemanticTagType.RelevantDate[];

	seats?: SemanticTagType.Seat[];
	securityScreening?: string;
	silenceRequested?: boolean;
	sportName?: string;

	totalPrice?: SemanticTagType.CurrencyAmount;
	transitProvider?: string;
	transitStatus?: string;
	transitStatusReason?: string;

	vehicleName?: string;
	vehicleNumber?: string;
	vehicleType?: string;
	venueEntrance?: string;
	venueLocation?: SemanticTagType.Location;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueGatesOpenDate?: string;

	venueName?: string;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueParkingLotsOpenDate?: string;

	venuePhoneNumber?: string;
	venueRoom?: string;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueRegionName?: string;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueEntranceGate?: string;

	wifiAccess?: SemanticTagType.WifiNetwork[];
}

export const Semantics = Joi.object<Semantics>().keys({
	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	admissionLevel: Joi.string(),

	airlineCode: Joi.string(),
	artistIDs: Joi.array().items(Joi.string()),
	awayTeamAbbreviation: Joi.string(),
	awayTeamLocation: Joi.string(),
	awayTeamName: Joi.string(),

	balance: CurrencyAmount,
	boardingGroup: Joi.string(),
	boardingSequenceNumber: Joi.string(),

	carNumber: Joi.string(),
	confirmationNumber: Joi.string(),
	currentArrivalDate: Joi.string(),
	currentBoardingDate: Joi.string(),
	currentDepartureDate: Joi.string(),

	departureAirportCode: Joi.string(),
	departureAirportName: Joi.string(),
	departureGate: Joi.string(),
	departureLocation: LocationSemantics,
	departureLocationDescription: Joi.string(),
	departurePlatform: Joi.string(),
	departureStationName: Joi.string(),
	departureTerminal: Joi.string(),
	destinationAirportCode: Joi.string(),
	destinationAirportName: Joi.string(),
	destinationGate: Joi.string(),
	destinationLocation: LocationSemantics,
	destinationLocationDescription: Joi.string(),
	destinationPlatform: Joi.string(),
	destinationStationName: Joi.string(),
	destinationTerminal: Joi.string(),
	duration: Joi.number(),

	eventEndDate: Joi.string(),
	eventName: Joi.string(),
	eventStartDate: Joi.string(),
	eventType: Joi.string().regex(
		/(PKEventTypeGeneric|PKEventTypeLivePerformance|PKEventTypeMovie|PKEventTypeSports|PKEventTypeConference|PKEventTypeConvention|PKEventTypeWorkshop|PKEventTypeSocialGathering)/,
	),

	flightCode: Joi.string(),
	flightNumber: Joi.number(),

	genre: Joi.string(),

	homeTeamAbbreviation: Joi.string(),
	homeTeamLocation: Joi.string(),
	homeTeamName: Joi.string(),
	leagueAbbreviation: Joi.string(),
	leagueName: Joi.string(),

	membershipProgramName: Joi.string(),
	membershipProgramNumber: Joi.string(),

	originalArrivalDate: Joi.string(),
	originalBoardingDate: Joi.string(),
	originalDepartureDate: Joi.string(),

	passengerName: PersonNameComponent,
	performerNames: Joi.array().items(Joi.string()),
	priorityStatus: Joi.string(),

	relevantDates: Joi.array().items(RelevantDate),

	seats: Joi.array().items(SeatSemantics),
	securityScreening: Joi.string(),
	silenceRequested: Joi.boolean(),
	sportName: Joi.string(),

	totalPrice: CurrencyAmount,
	transitProvider: Joi.string(),
	transitStatus: Joi.string(),
	transitStatusReason: Joi.string(),

	vehicleName: Joi.string(),
	vehicleNumber: Joi.string(),
	vehicleType: Joi.string(),

	venueEntrance: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueGatesOpenDate: Joi.string(),

	venueLocation: LocationSemantics,
	venueName: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueParkingLotsOpenDate: Joi.string(),

	venuePhoneNumber: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueRegionName: Joi.string(),

	venueRoom: Joi.string(),

	wifiAccess: Joi.array().items(WifiNetwork),

	venueEntranceGate: Joi.string(),
});
