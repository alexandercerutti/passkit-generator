import Joi from "joi";
import { RGB_HEX_COLOR_REGEX } from ".";

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

	interface Seat {
		seatSection?: string;
		seatRow?: string;
		seatNumber?: string;
		seatIdentifier?: string;
		seatType?: string;
		seatDescription?: string;

		/**
		 * For newly-introduced event tickets
		 * in iOS 18
		 */
		seatAisle?: string;

		/**
		 * For newly-introduced event tickets
		 * in iOS 18
		 */
		seatLevel?: string;

		/**
		 * For newly-introduced event tickets
		 * in iOS 18
		 */
		seatSectionColor?: string;
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

const SeatSemantics = Joi.object<SemanticTagType.Seat>().keys({
	seatSection: Joi.string(),
	seatRow: Joi.string(),
	seatNumber: Joi.string(),
	seatIdentifier: Joi.string(),
	seatType: Joi.string(),
	seatDescription: Joi.string(),

	/**
	 * Newly-introduced in iOS 18
	 * Used in poster event tickets
	 */
	seatAisle: Joi.string(),

	/**
	 * Newly-introduced in iOS 18
	 * Used in poster event tickets
	 */
	seatLevel: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	seatSectionColor: Joi.string().regex(RGB_HEX_COLOR_REGEX),
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

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	admissionLevelAbbreviation?: string;

	airlineCode?: string;
	artistIDs?: string[];

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	albumIDs?: string[];

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	airplay?: {
		airPlayDeviceGroupToken: string;
	}[];

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	attendeeName?: string;

	awayTeamAbbreviation?: string;
	awayTeamLocation?: string;
	awayTeamName?: string;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	additionalTicketAttributes?: string;

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

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	entranceDescription?: string;

	eventEndDate?: string;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 *
	 * This seem to exists but it is not
	 * known yet what it does...
	 */
	eventLiveMessage?: string;

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

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	playlistIDs?: string[];

	seats?: SemanticTagType.Seat[];
	securityScreening?: string;
	silenceRequested?: boolean;
	sportName?: string;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	tailgatingAllowed?: boolean;

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

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueBoxOfficeOpenDate?: string;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueDoorsOpenDate?: string;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueFanZoneOpenDate?: string;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueCloseDate?: string;

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

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueEntranceDoor?: string;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueEntrancePortal?: string;

	wifiAccess?: SemanticTagType.WifiNetwork[];
}

export const Semantics = Joi.object<Semantics>().keys({
	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	admissionLevel: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	admissionLevelAbbreviation: Joi.string(),

	airlineCode: Joi.string(),
	artistIDs: Joi.array().items(Joi.string()),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	albumIDs: Joi.array().items(Joi.string()),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	airplay: Joi.array().items({
		airplayDeviceGroupToken: Joi.string(),
	}),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	attendeeName: Joi.string(),

	awayTeamAbbreviation: Joi.string(),
	awayTeamLocation: Joi.string(),
	awayTeamName: Joi.string(),

	additionalTicketAttributes: Joi.string(),

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

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	entranceDescription: Joi.string(),

	eventEndDate: Joi.string(),
	eventName: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 *
	 * This seem to exists but it is not
	 * known yet what it does...
	 */
	eventLiveMessage: Joi.string(),

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

	playlistIDs: Joi.array().items(Joi.string()),

	seats: Joi.array().items(SeatSemantics),
	securityScreening: Joi.string(),
	silenceRequested: Joi.boolean(),
	sportName: Joi.string(),

	tailgatingAllowed: Joi.boolean(),

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

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueBoxOfficeOpenDate: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueDoorsOpenDate: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueFanZoneOpenDate: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueCloseDate: Joi.string(),

	venuePhoneNumber: Joi.string(),
	venueRoom: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueRegionName: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueEntranceGate: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueEntranceDoor: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	venueEntrancePortal: Joi.string(),

	wifiAccess: Joi.array().items(WifiNetwork),
});
