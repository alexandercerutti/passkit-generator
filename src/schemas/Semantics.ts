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
	 * @iOSVersion 26
	 *
	 * A zone number for boarding. Don't include the word _zone_.
	 */
	boardingZone?: string;

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
	 * @iOSVersion 26
	 *
	 * The name of the departure city to display on the boarding pass, such as `London` or `Shanghai`.
	 */
	departureCityName?: string;

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

	/**
	 * @iOSVersion 26
	 *
	 * A list of security programs that exist at the departure location.
	 * This only shows in the UI if a program is in `passengerEligibleSecurityPrograms`
	 * and at least one of `departureLocationSecurityPrograms` or `destinationLocationSecurityPrograms`
	 */
	departureLocationSecurityPrograms?: (
		| "PKTransitSecurityProgramTSAPreCheck"
		| "PKTransitSecurityProgramTSAPreCheckTouchlessID"
		| "PKTransitSecurityProgramOSS"
		| "PKTransitSecurityProgramITI"
		| "PKTransitSecurityProgramITD"
		| "PKTransitSecurityProgramGlobalEntry"
		| "PKTransitSecurityProgramCLEAR"
	)[];

	/**
	 * @iOSVersion 26
	 *
	 * The time zone of the departure location, such as `America/Chicago`.
	 * See the [IANA Time Zone Database](https://www.iana.org/time-zones) for the full list of supported time zones.
	 */
	departureLocationTimeZone?: string;

	destinationAirportCode?: string;
	destinationAirportName?: string;

	/**
	 * @iOSVersion 26
	 *
	 * The name of the destination city to display on the boarding pass, such as `London` or `Shanghai`.
	 */
	destinationCityName?: string;

	destinationGate?: string;
	destinationLocation?: SemanticTagType.Location;
	destinationLocationDescription?: string;
	destinationPlatform?: string;
	destinationStationName?: string;
	destinationTerminal?: string;

	/**
	 * @iOSVersion 26
	 *
	 * A list of security programs the passenger is eligible for. This only shows in the UI if a program is in `passengerEligibleSecurityPrograms` and at least one of `departureLocationSecurityPrograms` or `destinationLocationSecurityPrograms`.
	 */
	destinationLocationSecurityPrograms?: (
		| "PKTransitSecurityProgramTSAPreCheck"
		| "PKTransitSecurityProgramTSAPreCheckTouchlessID"
		| "PKTransitSecurityProgramOSS"
		| "PKTransitSecurityProgramITI"
		| "PKTransitSecurityProgramITD"
		| "PKTransitSecurityProgramGlobalEntry"
		| "PKTransitSecurityProgramCLEAR"
	)[];

	/**
	 * @iOSVersion 26
	 *
	 * The time zone of the destination location, such as `America/Los_Angeles`.
	 * See the [IANA Time Zone Database](https://www.iana.org/time-zones) for the full list of supported time zones.
	 */
	destinationLocationTimeZone?: string;

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
	 * @iOSVersion 26
	 *
	 * An optional boolean that indicates whether the passenger's international documents are verified. If set to `true` Wallet displays the badge on the boarding pass with the value from `internationalDocumentsVerifiedDeclarationName`.
	 */
	internationalDocumentsAreVerified?: boolean;

	/**
	 * @iOSVersion 26
	 *
	 * The name of the declaration given once the passenger's international documents are verified.
	 * Examples include `DOCS OK` or `Travel Ready`.
	 * If `internationalDocumentsAreVerified` is true, Wallet displays a badge on the boarding pass with this value.
	 */
	internationalDocumentsVerifiedDeclarationName?: string;

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
	 * @iOSVersion 26
	 *
	 * The MapKit Place IDs that reference the transit provider lounge locations.
	 * For more information, see [Identifying unique locations with Place IDs](https://developer.apple.com/documentation/MapKit/identifying-unique-locations-with-place-ids)
	 */
	loungePlaceIDs?: string[];

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

	/**
	 * @iOSVersion 26
	 *
	 * An array of airline-specific SSRs (Special Service Requests) that apply to the ticketed passenger.
	 */
	passengerAirlineSSRs?: string[];

	/**
	 * @iOSVersion 26
	 *
	 * A list of capabilties the passenger has. Only use this key for airline boarding passes.
	 */
	passengerCapabilities?: (
		| "PKPassengerCapabilityPreboarding"
		| "PKPassengerCapabilityPriorityBoarding"
		| "PKPassengerCapabilityCarryon"
		| "PKPassengerCapabilityPersonalItem"
	)[];

	/**
	 * @iOSVersion 26
	 *
	 * A list of security programs the passenger is eligible for. This only shows in the UI if a program is in `passengerEligibleSecurityPrograms` and at least one of `departureLocationSecurityPrograms` or `destinationLocationSecurityPrograms`.
	 */
	passengerEligibleSecurityPrograms?: (
		| "PKTransitSecurityProgramTSAPreCheck"
		| "PKTransitSecurityProgramTSAPreCheckTouchlessID"
		| "PKTransitSecurityProgramOSS"
		| "PKTransitSecurityProgramITI"
		| "PKTransitSecurityProgramITD"
		| "PKTransitSecurityProgramGlobalEntry"
		| "PKTransitSecurityProgramCLEAR"
	)[];

	/**
	 * @iOSVersion 26
	 *
	 * An array of IATA information SSRs that apply to the ticketed passenger. A comprehensive list of service SSRs can be found in the [IATA Airlines Developer Guide](https://guides.developer.iata.org/docs/21-1_ImplementationGuide.pdf) under A List of Information SSRs.
	 */
	passengerInformationSSRs?: string[];

	/**
	 * @iOSVersion 26
	 *
	 * An array of IATA SSRs that apply to the ticketed passenger. A comprehensive list of service SSRs can be found in the [IATA Airlines Developer Guide](https://guides.developer.iata.org/docs/21-1_ImplementationGuide.pdf) under A List of Service SSRs.
	 */
	passengerServiceSSRs?: string[];

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

	/**
	 * @iOSVersion 26
	 *
	 * A localizable string that denotes the ticket class, such as `Saver`, `Economy`, `First`. This value displays as a badge on the boarding pass.
	 */
	ticketFareClass?: string;

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
	 * @iOSVersion 26
	 *
	 * A zone number for boarding. Don't include the word _zone_.
	 */
	boardingZone: Joi.string(),

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
	 * @iOSVersion 26
	 *
	 * The name of the departure city to display on the boarding pass, such as London or Shanghai.
	 */
	departureCityName: Joi.string(),

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

	/**
	 * @iOSVersion 26
	 *
	 * A list of security programs that exist at the departure location. This only shows in the UI if a program is in `passengerEligibleSecurityPrograms` and at least one of `departureLocationSecurityPrograms` or `destinationLocationSecurityPrograms`
	 */
	departureLocationSecurityPrograms: Joi.array().items(
		Joi.string().regex(
			/(PKTransitSecurityProgramTSAPreCheck|PKTransitSecurityProgramTSAPreCheckTouchlessID|PKTransitSecurityProgramOSS|PKTransitSecurityProgramITI|PKTransitSecurityProgramITD|PKTransitSecurityProgramGlobalEntry|PKTransitSecurityProgramCLEAR)/,
		),
	),

	/**
	 * @iOSVersion 26
	 *
	 * The time zone of the departure location, such as America/Chicago. See the IANA Time Zone Database for the full list of supported time zones.
	 */
	departureLocationTimeZone: Joi.string(),
	destinationAirportCode: Joi.string(),
	destinationAirportName: Joi.string(),

	/**
	 * @iOSVersion 26
	 *
	 * The name of the destination city to display on the boarding pass, such as London or Shanghai.
	 */
	destinationCityName: Joi.string(),

	destinationGate: Joi.string(),
	destinationLocation: SemanticTagType.Location,
	destinationLocationDescription: Joi.string(),
	destinationPlatform: Joi.string(),
	destinationStationName: Joi.string(),
	destinationTerminal: Joi.string(),

	/**
	 * @iOSVersion 26
	 *
	 * A list of security programs the passenger is eligible for. This only shows in the UI if a program is in passengerEligibleSecurityPrograms and at least one of departureLocationSecurityPrograms or destinationLocationSecurityPrograms.
	 */
	destinationLocationSecurityPrograms: Joi.array().items(
		Joi.string().regex(
			/(PKTransitSecurityProgramTSAPreCheck|PKTransitSecurityProgramTSAPreCheckTouchlessID|PKTransitSecurityProgramOSS|PKTransitSecurityProgramITI|PKTransitSecurityProgramITD|PKTransitSecurityProgramGlobalEntry|PKTransitSecurityProgramCLEAR)/,
		),
	),

	/**
	 * @iOSVersion 26
	 *
	 * The time zone of the destination location, such as America/Los_Angeles. See the IANA Time Zone Database for the full list of supported time zones.
	 */
	destinationLocationTimeZone: Joi.string(),
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
	 * @iOSVersion 26
	 *
	 * An optional boolean that indicates whether the passenger's international documents are verified. If set to `true` Wallet displays the badge on the boarding pass with the value from `internationalDocumentsVerifiedDeclarationName`.
	 */
	internationalDocumentsAreVerified: Joi.boolean(),

	/**
	 * @iOSVersion 26
	 *
	 * The name of the declaration given once the passenger's international documents are verified. Examples include `DOCS OK` or `Travel Ready`. If `internationalDocumentsAreVerified` is true, Wallet displays a badge on the boarding pass with this value.
	 */
	internationalDocumentsVerifiedDeclarationName: Joi.string(),

	/**
	 * The abbreviated league name for a sports event. Use this key only for a sports event ticket.
	 */
	leagueAbbreviation: Joi.string(),

	/**
	 * The unabbreviated league name for a sports event. Use this key only for a sports event ticket.
	 */
	leagueName: Joi.string(),

	/**
	 * @iOSVersion 26
	 *
	 * The MapKit Place IDs that reference the transit provider lounge locations. For more information, see [Identifying unique locations with Place IDs](https://developer.apple.com/documentation/MapKit/identifying-unique-locations-with-place-ids)
	 */
	loungePlaceIDs: Joi.array().items(Joi.string()),

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

	/**
	 * @iOSVersion 26
	 *
	 * An array of airline-specific SSRs (Special Service Requests) that apply to the ticketed passenger.
	 */
	passengerAirlineSSRs: Joi.array().items(Joi.string()),

	/**
	 * @iOSVersion 26
	 *
	 * A list of capabilties the passenger has. Only use this key for airline boarding passes.
	 */
	passengerCapabilities: Joi.array().items(
		Joi.string().regex(
			/(PKPassengerCapabilityPreboarding|PKPassengerCapabilityPriorityBoarding|PKPassengerCapabilityCarryon|PKPassengerCapabilityPersonalItem)/,
		),
	),

	/**
	 * @iOSVersion 26
	 *
	 * A list of security programs the passenger is eligible for. This only shows in the UI if a program is in `passengerEligibleSecurityPrograms` and at least one of `departureLocationSecurityPrograms` or `destinationLocationSecurityPrograms`.
	 */
	passengerEligibleSecurityPrograms: Joi.array().items(
		Joi.string().regex(
			/(PKTransitSecurityProgramTSAPreCheck|PKTransitSecurityProgramTSAPreCheckTouchlessID|PKTransitSecurityProgramOSS|PKTransitSecurityProgramITI|PKTransitSecurityProgramITD|PKTransitSecurityProgramGlobalEntry|PKTransitSecurityProgramCLEAR)/,
		),
	),

	/**
	 * @iOSVersion 26
	 *
	 * An array of IATA information SSRs that apply to the ticketed passenger. A comprehensive list of service SSRs can be found in the [IATA Airlines Developer Guide](https://guides.developer.iata.org/docs/21-1_ImplementationGuide.pdf) under A List of Information SSRs.
	 */
	passengerInformationSSRs: Joi.array().items(Joi.string()),

	/**
	 * @iOSVersion 26
	 *
	 * An array of IATA SSRs that apply to the ticketed passenger. A comprehensive list of service SSRs can be found in the [IATA Airlines Developer Guide](https://guides.developer.iata.org/docs/21-1_ImplementationGuide.pdf) under A List of Service SSRs.
	 */
	passengerServiceSSRs: Joi.array().items(Joi.string()),

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

	/**
	 * @iOSVersion 26
	 *
	 * A localizable string that denotes the ticket class, such as `Saver`, `Economy`, `First`. This value displays as a badge on the boarding pass.
	 */
	ticketFareClass: Joi.string(),

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
