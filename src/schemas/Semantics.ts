import { z } from "zod";
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

export type Semantics = z.infer<typeof Semantics>;

export const Semantics = z.object({
	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	admissionLevel: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	admissionLevelAbbreviation: z.string().optional(),

	airlineCode: z.string().optional(),
	artistIDs: z.array(z.string()).optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	albumIDs: z.array(z.string()).optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	airplay: z
		.array(
			z.object({
				airplayDeviceGroupToken: z.string(),
			}),
		)
		.optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	attendeeName: z.string().optional(),

	awayTeamAbbreviation: z.string().optional(),
	awayTeamLocation: z.string().optional(),
	awayTeamName: z.string().optional(),

	/**
	 * @iOSVersion 18
	 *
	 * Additional ticket attributes that other tags or keys in the pass don’t include.
	 * Use this key for any type of event ticket.
	 */
	additionalTicketAttributes: z.string().optional(),

	balance: SemanticTagType.CurrencyAmount.optional(),

	/**
	 * A group number for boarding.
	 * Use this key for any type of boarding pass.
	 */
	boardingGroup: z.string().optional(),

	/**
	 * A sequence number for boarding.
	 * Use this key for any type of boarding pass.
	 */
	boardingSequenceNumber: z.string().optional(),

	/**
	 * @iOSVersion 26
	 *
	 * A zone number for boarding. Don't include the word _zone_.
	 */
	boardingZone: z.string().optional(),

	/**
	 * The number of the passenger car.
	 * A train car is also called a carriage, wagon, coach, or bogie in some countries.
	 * Use this key only for a train or other rail boarding pass.
	 */
	carNumber: z.string().optional(),

	confirmationNumber: z.string().optional(),
	currentArrivalDate: z.string().optional(),
	currentBoardingDate: z.string().optional(),
	currentDepartureDate: z.string().optional(),

	/**
	 * The IATA airport code for the departure airport, such as `MPM` or `LHR`.
	 * Use this key only for airline boarding passes.
	 */
	departureAirportCode: z.string().optional(),

	/**
	 * The full name of the departure airport, such as `Maputo International Airport`.
	 * Use this key only for airline boarding passes.
	 */
	departureAirportName: z.string().optional(),

	/**
	 * @iOSVersion 26
	 *
	 * The name of the departure city to display on the boarding pass, such as London or Shanghai.
	 */
	departureCityName: z.string().optional(),

	/**
	 * The gate number or letters of the departure gate, such as 1A. Don’t include the word gate.
	 */
	departureGate: z.string().optional(),

	/**
	 * An object that represents the geographic coordinates of the transit departure location,
	 * suitable for display on a map.
	 * If possible, use precise locations, which are more useful to travelers;
	 * for example, the specific location of an airport gate.
	 *
	 * Use this key for any type of boarding pass.
	 */
	departureLocation: SemanticTagType.Location.optional(),

	departureLocationDescription: z.string().optional(),
	departurePlatform: z.string().optional(),
	departureStationName: z.string().optional(),
	departureTerminal: z.string().optional(),

	/**
	 * @iOSVersion 26
	 *
	 * A list of security programs that exist at the departure location. This only shows in the UI if a program is in `passengerEligibleSecurityPrograms` and at least one of `departureLocationSecurityPrograms` or `destinationLocationSecurityPrograms`
	 */
	departureLocationSecurityPrograms: z.array(
		z.literal([
			"PKTransitSecurityProgramTSAPreCheck",
			"PKTransitSecurityProgramTSAPreCheckTouchlessID",
			"PKTransitSecurityProgramOSS",
			"PKTransitSecurityProgramITI",
			"PKTransitSecurityProgramITD",
			"PKTransitSecurityProgramGlobalEntry",
			"PKTransitSecurityProgramCLEAR",
		]),
	),

	/**
	 * @iOSVersion 26
	 *
	 * The time zone of the departure location, such as America/Chicago. See the IANA Time Zone Database for the full list of supported time zones.
	 */
	departureLocationTimeZone: z.string().optional(),
	destinationAirportCode: z.string().optional(),
	destinationAirportName: z.string().optional(),

	/**
	 * @iOSVersion 26
	 *
	 * The name of the destination city to display on the boarding pass, such as London or Shanghai.
	 */
	destinationCityName: z.string().optional(),

	destinationGate: z.string().optional(),
	destinationLocation: SemanticTagType.Location.optional(),
	destinationLocationDescription: z.string().optional(),
	destinationPlatform: z.string().optional(),
	destinationStationName: z.string().optional(),
	destinationTerminal: z.string().optional(),

	/**
	 * @iOSVersion 26
	 *
	 * A list of security programs the passenger is eligible for. This only shows in the UI if a program is in passengerEligibleSecurityPrograms and at least one of departureLocationSecurityPrograms or destinationLocationSecurityPrograms.
	 */
	destinationLocationSecurityPrograms: z.array(
		z.literal([
			"PKTransitSecurityProgramTSAPreCheck",
			"PKTransitSecurityProgramTSAPreCheckTouchlessID",
			"PKTransitSecurityProgramOSS",
			"PKTransitSecurityProgramITI",
			"PKTransitSecurityProgramITD",
			"PKTransitSecurityProgramGlobalEntry",
			"PKTransitSecurityProgramCLEAR",
		]),
	),

	/**
	 * @iOSVersion 26
	 *
	 * The time zone of the destination location, such as America/Los_Angeles. See the IANA Time Zone Database for the full list of supported time zones.
	 */
	destinationLocationTimeZone: z.string().optional(),
	duration: z.number().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	entranceDescription: z.string().optional(),

	eventEndDate: z.string().optional(),
	eventName: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * Shows a message in the live activity
	 * when the activity starts.
	 */
	eventLiveMessage: z.string().optional(),

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
	eventStartDateInfo: SemanticTagType.EventDateInfo.optional(),

	eventStartDate: z.string().optional(),

	eventType: z
		.enum([
			"PKEventTypeGeneric",
			"PKEventTypeLivePerformance",
			"PKEventTypeMovie",
			"PKEventTypeSports",
			"PKEventTypeConference",
			"PKEventTypeConvention",
			"PKEventTypeWorkshop",
			"PKEventTypeSocialGathering",
		])
		.optional(),

	flightCode: z.string().optional(),
	flightNumber: z.number().optional(),

	genre: z.string().optional(),

	homeTeamAbbreviation: z.string().optional(),
	homeTeamLocation: z.string().optional(),
	homeTeamName: z.string().optional(),

	/**
	 * @iOSVersion 26
	 *
	 * An optional boolean that indicates whether the passenger's international documents are verified. If set to `true` Wallet displays the badge on the boarding pass with the value from `internationalDocumentsVerifiedDeclarationName`.
	 */
	internationalDocumentsAreVerified: z.boolean().optional(),

	/**
	 * @iOSVersion 26
	 *
	 * The name of the declaration given once the passenger's international documents are verified. Examples include `DOCS OK` or `Travel Ready`. If `internationalDocumentsAreVerified` is true, Wallet displays a badge on the boarding pass with this value.
	 */
	internationalDocumentsVerifiedDeclarationName: z.string().optional(),

	/**
	 * The abbreviated league name for a sports event. Use this key only for a sports event ticket.
	 */
	leagueAbbreviation: z.string().optional(),

	/**
	 * The unabbreviated league name for a sports event. Use this key only for a sports event ticket.
	 */
	leagueName: z.string().optional(),

	/**
	 * @iOSVersion 26
	 *
	 * The MapKit Place IDs that reference the transit provider lounge locations. For more information, see [Identifying unique locations with Place IDs](https://developer.apple.com/documentation/MapKit/identifying-unique-locations-with-place-ids)
	 */
	loungePlaceIDs: z.array(z.string()).optional(),

	/**
	 * The name of a frequent flyer or loyalty program.
	 * Use this key for any type of boarding pass.
	 */

	membershipProgramName: z.string().optional(),

	/**
	 * The ticketed passenger’s frequent flyer or loyalty number.
	 * Use this key for any type of boarding pass.
	 */
	membershipProgramNumber: z.string().optional(),

	/**
	 * @iOSVersion 26
	 *
	 * The ticketed passenger’s frequent flyer or loyalty program status.
	 * Use this key for any type of boarding pass.
	 */
	membershipProgramStatus: z.string().optional(),

	originalArrivalDate: z.string().optional(),
	originalBoardingDate: z.string().optional(),
	originalDepartureDate: z.string().optional(),

	/**
	 * An object that represents the name of the passenger.
	 * Use this key for any type of boarding pass.
	 */
	passengerName: SemanticTagType.PersonNameComponents.optional(),

	/**
	 * @iOSVersion 26
	 *
	 * An array of airline-specific SSRs (Special Service Requests) that apply to the ticketed passenger.
	 */
	passengerAirlineSSRs: z.array(z.string()).optional(),

	/**
	 * @iOSVersion 26
	 *
	 * A list of capabilities the passenger has. Only use this key for airline boarding passes.
	 */

	passengerCapabilities: z
		.array(
			z.literal([
				"PKPassengerCapabilityPreboarding",
				"PKPassengerCapabilityPriorityBoarding",
				"PKPassengerCapabilityCarryon",
				"PKPassengerCapabilityPersonalItem",
			]),
		)
		.optional(),

	/**
	 * @iOSVersion 26
	 *
	 * A list of security programs the passenger is eligible for. This only shows in the UI if a program is in `passengerEligibleSecurityPrograms` and at least one of `departureLocationSecurityPrograms` or `destinationLocationSecurityPrograms`.
	 */
	passengerEligibleSecurityPrograms: z
		.array(
			z.literal([
				"PKTransitSecurityProgramTSAPreCheck",
				"PKTransitSecurityProgramTSAPreCheckTouchlessID",
				"PKTransitSecurityProgramOSS",
				"PKTransitSecurityProgramITI",
				"PKTransitSecurityProgramITD",
				"PKTransitSecurityProgramGlobalEntry",
				"PKTransitSecurityProgramCLEAR",
			]),
		)
		.optional(),

	/**
	 * @iOSVersion 26
	 *
	 * An array of IATA information SSRs that apply to the ticketed passenger. A comprehensive list of service SSRs can be found in the [IATA Airlines Developer Guide](https://guides.developer.iata.org/docs/21-1_ImplementationGuide.pdf) under A List of Information SSRs.
	 */
	passengerInformationSSRs: z.array(z.string()).optional(),

	/**
	 * @iOSVersion 26
	 *
	 * An array of IATA SSRs that apply to the ticketed passenger. A comprehensive list of service SSRs can be found in the [IATA Airlines Developer Guide](https://guides.developer.iata.org/docs/21-1_ImplementationGuide.pdf) under A List of Service SSRs.
	 */
	passengerServiceSSRs: z.array(z.string()).optional(),

	performerNames: z.array(z.string()).optional(),

	/**
	 * The priority status the ticketed passenger holds, such as `Gold` or `Silver`.
	 * Use this key for any type of boarding pass.
	 */
	priorityStatus: z.string().optional(),

	playlistIDs: z.array(z.string()).optional(),

	seats: z.array(SemanticTagType.Seat).optional(),
	securityScreening: z.string().optional(),
	silenceRequested: z.boolean().optional(),
	sportName: z.string().optional(),

	tailgatingAllowed: z.boolean().optional(),

	/**
	 * @iOSVersion 26
	 *
	 * A localizable string that denotes the ticket class, such as `Saver`, `Economy`, `First`. This value displays as a badge on the boarding pass.
	 */
	ticketFareClass: z.string().optional(),

	totalPrice: SemanticTagType.CurrencyAmount.optional(),

	/**
	 * The name of the transit company. Use this key for any type of boarding pass.
	 */
	transitProvider: z.string().optional(),

	/**
	 * A brief description of the current boarding status for the vessel, such as `On Time` or `Delayed`.
	 * For delayed status, provide `currentBoardingDate`, `currentDepartureDate`, and `currentArrivalDate` where available.
	 * Use this key for any type of boarding pass.
	 */
	transitStatus: z.string().optional(),

	/**
	 * A brief description that explains the reason for the current transitStatus, such as `Thunderstorms`.
	 * Use this key for any type of boarding pass.
	 */
	transitStatusReason: z.string().optional(),

	vehicleName: z.string().optional(),
	vehicleNumber: z.string().optional(),
	vehicleType: z.string().optional(),

	venueEntrance: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueGatesOpenDate: z.string().optional(),

	venueLocation: SemanticTagType.Location.optional(),
	venueName: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueParkingLotsOpenDate: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueBoxOfficeOpenDate: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueDoorsOpenDate: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueFanZoneOpenDate: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueOpenDate: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueCloseDate: z.string().optional(),

	venuePhoneNumber: z.string().optional(),
	venueRoom: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueRegionName: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntranceGate: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntranceDoor: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	venueEntrancePortal: z.string().optional(),

	wifiAccess: z.array(SemanticTagType.WifiNetwork).optional(),
});
