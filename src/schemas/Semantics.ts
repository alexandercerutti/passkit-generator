import Joi from "joi";
import * as SemanticTagType from "./SemanticTagType.js";

/**
 * For a better description of every single field,
 * please refer to Apple official documentation.
 *
 * @see https://developer.apple.com/documentation/walletpasses/semantictags
 */

/**
 * Alphabetical order
 * @see https://developer.apple.com/documentation/walletpasses/semantictags
 */

export interface Semantics {
	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	admissionLevel?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	admissionLevelAbbreviation?: string;

	airlineCode?: string;
	artistIDs?: string[];

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	albumIDs?: string[];

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	airplay?: {
		airPlayDeviceGroupToken: string;
	}[];

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	attendeeName?: string;

	awayTeamAbbreviation?: string;
	awayTeamLocation?: string;
	awayTeamName?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
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
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	entranceDescription?: string;

	eventEndDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * Shows a message in the live activity
	 * when the activity starts.
	 */
	eventLiveMessage?: string;

	eventName?: string;
	eventStartDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout).
	 *
	 * Can be used as an alternative way to
	 * show show start date, with more control
	 * on time and timeZone details and as
	 * a way to show the event guide, both
	 * instead of `eventStartDate`.
	 */
	eventStartDateInfo?: SemanticTagType.EventDateInfo;

	/**
	 * @iOSVersion < 18
	 * Since iOS 18, for the event tickets these determine
	 * the template to be used when rendering the pass.
	 *
	 * - Generic Template
	 * 		- "PKEventTypeGeneric"
	 * 		- "PKEventTypeMovie"
	 * 		- "PKEventTypeConference"
	 * 		- "PKEventTypeConvention"
	 * 		- "PKEventTypeWorkshop"
	 * 		- "PKEventTypeSocialGathering"
	 * - Sport Template
	 * 		- "PKEventTypeSports"
	 * - Live Performance Template
	 * 		- "PKEventTypeLivePerformance";
	 */

	eventType?:
		| "PKEventTypeGeneric"
		| "PKEventTypeMovie"
		| "PKEventTypeConference"
		| "PKEventTypeConvention"
		| "PKEventTypeWorkshop"
		| "PKEventTypeSocialGathering"
		| "PKEventTypeSports"
		| "PKEventTypeLivePerformance";

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
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	playlistIDs?: string[];

	seats?: SemanticTagType.Seat[];
	securityScreening?: string;
	silenceRequested?: boolean;
	sportName?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
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
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueGatesOpenDate?: string;

	venueName?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueParkingLotsOpenDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueBoxOfficeOpenDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueDoorsOpenDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueFanZoneOpenDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueOpenDate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueCloseDate?: string;

	venuePhoneNumber?: string;
	venueRoom?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueRegionName?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntranceGate?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntranceDoor?: string;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntrancePortal?: string;

	wifiAccess?: SemanticTagType.WifiNetwork[];
}

export const Semantics = Joi.object<Semantics>().keys({
	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	admissionLevel: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	admissionLevelAbbreviation: Joi.string(),

	airlineCode: Joi.string(),
	artistIDs: Joi.array().items(Joi.string()),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	albumIDs: Joi.array().items(Joi.string()),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	airplay: Joi.array().items({
		airplayDeviceGroupToken: Joi.string(),
	}),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	attendeeName: Joi.string(),

	awayTeamAbbreviation: Joi.string(),
	awayTeamLocation: Joi.string(),
	awayTeamName: Joi.string(),

	additionalTicketAttributes: Joi.string(),

	balance: SemanticTagType.CurrencyAmount,
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
	departureLocation: SemanticTagType.Location,
	departureLocationDescription: Joi.string(),
	departurePlatform: Joi.string(),
	departureStationName: Joi.string(),
	departureTerminal: Joi.string(),
	destinationAirportCode: Joi.string(),
	destinationAirportName: Joi.string(),
	destinationGate: Joi.string(),
	destinationLocation: SemanticTagType.Location,
	destinationLocationDescription: Joi.string(),
	destinationPlatform: Joi.string(),
	destinationStationName: Joi.string(),
	destinationTerminal: Joi.string(),
	duration: Joi.number(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	entranceDescription: Joi.string(),

	eventEndDate: Joi.string(),
	eventName: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * Shows a message in the live activity
	 * when the activity starts.
	 */
	eventLiveMessage: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout).
	 *
	 * Can be used as an alternative way to
	 * show show start date, with more control
	 * on time and timeZone details and as
	 * a way to show the event guide, both
	 * instead of `eventStartDate`.
	 */
	eventStartDateInfo: SemanticTagType.EventDateInfo,

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

	passengerName: SemanticTagType.PersonNameComponents,
	performerNames: Joi.array().items(Joi.string()),
	priorityStatus: Joi.string(),

	playlistIDs: Joi.array().items(Joi.string()),

	seats: Joi.array().items(SemanticTagType.Seat),
	securityScreening: Joi.string(),
	silenceRequested: Joi.boolean(),
	sportName: Joi.string(),

	tailgatingAllowed: Joi.boolean(),

	totalPrice: SemanticTagType.CurrencyAmount,
	transitProvider: Joi.string(),
	transitStatus: Joi.string(),
	transitStatusReason: Joi.string(),

	vehicleName: Joi.string(),
	vehicleNumber: Joi.string(),
	vehicleType: Joi.string(),

	venueEntrance: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueGatesOpenDate: Joi.string(),

	venueLocation: SemanticTagType.Location,
	venueName: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueParkingLotsOpenDate: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueBoxOfficeOpenDate: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueDoorsOpenDate: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueFanZoneOpenDate: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueOpenDate: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueCloseDate: Joi.string(),

	venuePhoneNumber: Joi.string(),
	venueRoom: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueRegionName: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntranceGate: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntranceDoor: Joi.string(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntrancePortal: Joi.string(),

	wifiAccess: Joi.array().items(SemanticTagType.WifiNetwork),
});
