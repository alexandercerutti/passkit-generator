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
	 *
	 * Additional ticket attributes that other tags or keys in the pass don’t include.
	 * Use this key for any type of event ticket.
	 */
	additionalTicketAttributes?: string;

	balance?: SemanticTagType.CurrencyAmount;

	/**
	 * A group number for boarding.
	 * Use this key for any type of boarding pass.
	 */
	boardingGroup?: string;

	/**
	 * A sequence number for boarding.
	 * Use this key for any type of boarding pass.
	 */
	boardingSequenceNumber?: string;

	/**
	 * The number of the passenger car.
	 * A train car is also called a carriage, wagon, coach, or bogie in some countries.
	 * Use this key only for a train or other rail boarding pass.
	 */
	carNumber?: string;

	confirmationNumber?: string;
	currentArrivalDate?: string;
	currentBoardingDate?: string;
	currentDepartureDate?: string;

	/**
	 * The IATA airport code for the departure airport, such as `MPM` or `LHR`.
	 * Use this key only for airline boarding passes.
	 */
	departureAirportCode?: string;

	/**
	 * The full name of the departure airport, such as Maputo International Airport. Use this key only for airline boarding passes.
	 */
	departureAirportName?: string;

	/**
	 * The gate number or letters of the departure gate, such as 1A. Don’t include the word gate.
	 */
	departureGate?: string;

	/**
	 * An object that represents the geographic coordinates of the transit departure location,
	 * suitable for display on a map.
	 * If possible, use precise locations, which are more useful to travelers;
	 * for example, the specific location of an airport gate.
	 *
	 * Use this key for any type of boarding pass.
	 */
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

	/**
	 * The abbreviated league name for a sports event. Use this key only for a sports event ticket.
	 */
	leagueAbbreviation?: string;

	/**
	 * The unabbreviated league name for a sports event.
	 * Use this key only for a sports event ticket.
	 */
	leagueName?: string;

	/**
	 * The name of a frequent flyer or loyalty program.
	 * Use this key for any type of boarding pass.
	 */
	membershipProgramName?: string;

	/**
	 * The ticketed passenger’s frequent flyer or loyalty number.
	 * Use this key for any type of boarding pass.
	 */
	membershipProgramNumber?: string;

	/**
	 * @iOSVersion 26
	 *
	 * The ticketed passenger’s frequent flyer or loyalty program status.
	 * Use this key for any type of boarding pass.
	 */
	membershipProgramStatus?: string;

	originalArrivalDate?: string;
	originalBoardingDate?: string;
	originalDepartureDate?: string;

	/**
	 * An object that represents the name of the passenger.
	 * Use this key for any type of boarding pass.
	 */
	passengerName?: SemanticTagType.PersonNameComponents;

	performerNames?: string[];

	/**
	 * The priority status the ticketed passenger holds, such as `Gold` or `Silver`.
	 * Use this key for any type of boarding pass.
	 */
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

	/**
	 * The name of the transit company. Use this key for any type of boarding pass.
	 */
	transitProvider?: string;

	/**
	 * A brief description of the current boarding status for the vessel, such as `On Time` or `Delayed`.
	 * For delayed status, provide `currentBoardingDate`, `currentDepartureDate`, and `currentArrivalDate` where available.
	 * Use this key for any type of boarding pass.
	 */
	transitStatus?: string;

	/**
	 * A brief description that explains the reason for the current transitStatus, such as `Thunderstorms`.
	 * Use this key for any type of boarding pass.
	 */
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

	/**
	 * @iOSVersion 18
	 *
	 * Additional ticket attributes that other tags or keys in the pass don’t include.
	 * Use this key for any type of event ticket.
	 */
	additionalTicketAttributes: Joi.string(),

	balance: SemanticTagType.CurrencyAmount,

	/**
	 * A group number for boarding.
	 * Use this key for any type of boarding pass.
	 */
	boardingGroup: Joi.string(),

	/**
	 * A sequence number for boarding.
	 * Use this key for any type of boarding pass.
	 */
	boardingSequenceNumber: Joi.string(),

	/**
	 * The number of the passenger car.
	 * A train car is also called a carriage, wagon, coach, or bogie in some countries.
	 * Use this key only for a train or other rail boarding pass.
	 */
	carNumber: Joi.string(),

	confirmationNumber: Joi.string(),
	currentArrivalDate: Joi.string(),
	currentBoardingDate: Joi.string(),
	currentDepartureDate: Joi.string(),

	/**
	 * The IATA airport code for the departure airport, such as `MPM` or `LHR`.
	 * Use this key only for airline boarding passes.
	 */
	departureAirportCode: Joi.string(),

	/**
	 * The full name of the departure airport, such as `Maputo International Airport`.
	 * Use this key only for airline boarding passes.
	 */
	departureAirportName: Joi.string(),

	/**
	 * The gate number or letters of the departure gate, such as 1A. Don’t include the word gate.
	 */
	departureGate: Joi.string(),

	/**
	 * An object that represents the geographic coordinates of the transit departure location,
	 * suitable for display on a map.
	 * If possible, use precise locations, which are more useful to travelers;
	 * for example, the specific location of an airport gate.
	 *
	 * Use this key for any type of boarding pass.
	 */
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

	/**
	 * The abbreviated league name for a sports event. Use this key only for a sports event ticket.
	 */
	leagueAbbreviation: Joi.string(),

	/**
	 * The unabbreviated league name for a sports event. Use this key only for a sports event ticket.
	 */
	leagueName: Joi.string(),

	/**
	 * The name of a frequent flyer or loyalty program.
	 * Use this key for any type of boarding pass.
	 */

	membershipProgramName: Joi.string(),

	/**
	 * The ticketed passenger’s frequent flyer or loyalty number.
	 * Use this key for any type of boarding pass.
	 */
	membershipProgramNumber: Joi.string(),

	/**
	 * @iOSVersion 26
	 *
	 * The ticketed passenger’s frequent flyer or loyalty program status.
	 * Use this key for any type of boarding pass.
	 */
	membershipProgramStatus: Joi.string(),

	originalArrivalDate: Joi.string(),
	originalBoardingDate: Joi.string(),
	originalDepartureDate: Joi.string(),

	/**
	 * An object that represents the name of the passenger.
	 * Use this key for any type of boarding pass.
	 */
	passengerName: SemanticTagType.PersonNameComponents,

	performerNames: Joi.array().items(Joi.string()),

	/**
	 * The priority status the ticketed passenger holds, such as `Gold` or `Silver`.
	 * Use this key for any type of boarding pass.
	 */
	priorityStatus: Joi.string(),

	playlistIDs: Joi.array().items(Joi.string()),

	seats: Joi.array().items(SemanticTagType.Seat),
	securityScreening: Joi.string(),
	silenceRequested: Joi.boolean(),
	sportName: Joi.string(),

	tailgatingAllowed: Joi.boolean(),

	totalPrice: SemanticTagType.CurrencyAmount,

	/**
	 * The name of the transit company. Use this key for any type of boarding pass.
	 */
	transitProvider: Joi.string(),

	/**
	 * A brief description of the current boarding status for the vessel, such as `On Time` or `Delayed`.
	 * For delayed status, provide `currentBoardingDate`, `currentDepartureDate`, and `currentArrivalDate` where available.
	 * Use this key for any type of boarding pass.
	 */
	transitStatus: Joi.string(),

	/**
	 * A brief description that explains the reason for the current transitStatus, such as `Thunderstorms`.
	 * Use this key for any type of boarding pass.
	 */
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
