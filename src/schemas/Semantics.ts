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

export const Semantics = z
	.object({
		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		admissionLevel: z.string(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		admissionLevelAbbreviation: z.string(),

		airlineCode: z.string(),
		artistIDs: z.array(z.string()),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		albumIDs: z.array(z.string()),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		airplay: z.array(
			z.object({
				airplayDeviceGroupToken: z.string(),
			}),
		),
		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		attendeeName: z.string(),

		awayTeamAbbreviation: z.string(),
		awayTeamLocation: z.string(),
		awayTeamName: z.string(),

		/**
		 * @iOSVersion 18
		 *
		 * Additional ticket attributes that other tags or keys in the pass don’t include.
		 * Use this key for any type of event ticket.
		 */
		additionalTicketAttributes: z.string(),

		balance: SemanticTagType.CurrencyAmount,

		/**
		 * A group number for boarding.
		 * Use this key for any type of boarding pass.
		 */
		boardingGroup: z.string(),

		/**
		 * A sequence number for boarding.
		 * Use this key for any type of boarding pass.
		 */
		boardingSequenceNumber: z.string(),

		/**
		 * @iOSVersion 26
		 *
		 * A zone number for boarding. Don't include the word _zone_.
		 */
		boardingZone: z.string(),

		/**
		 * The number of the passenger car.
		 * A train car is also called a carriage, wagon, coach, or bogie in some countries.
		 * Use this key only for a train or other rail boarding pass.
		 */
		carNumber: z.string(),

		confirmationNumber: z.string(),
		currentArrivalDate: z.string(),
		currentBoardingDate: z.string(),
		currentDepartureDate: z.string(),

		/**
		 * The IATA airport code for the departure airport, such as `MPM` or `LHR`.
		 * Use this key only for airline boarding passes.
		 */
		departureAirportCode: z.string(),

		/**
		 * The full name of the departure airport, such as `Maputo International Airport`.
		 * Use this key only for airline boarding passes.
		 */
		departureAirportName: z.string(),

		/**
		 * @iOSVersion 26
		 *
		 * The name of the departure city to display on the boarding pass, such as London or Shanghai.
		 */
		departureCityName: z.string(),

		/**
		 * The gate number or letters of the departure gate, such as 1A. Don’t include the word gate.
		 */
		departureGate: z.string(),

		/**
		 * An object that represents the geographic coordinates of the transit departure location,
		 * suitable for display on a map.
		 * If possible, use precise locations, which are more useful to travelers;
		 * for example, the specific location of an airport gate.
		 *
		 * Use this key for any type of boarding pass.
		 */
		departureLocation: SemanticTagType.Location,

		departureLocationDescription: z.string(),
		departurePlatform: z.string(),
		departureStationName: z.string(),
		departureTerminal: z.string(),

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
		departureLocationTimeZone: z.string(),
		destinationAirportCode: z.string(),
		destinationAirportName: z.string(),

		/**
		 * @iOSVersion 26
		 *
		 * The name of the destination city to display on the boarding pass, such as London or Shanghai.
		 */
		destinationCityName: z.string(),

		destinationGate: z.string(),
		destinationLocation: SemanticTagType.Location,
		destinationLocationDescription: z.string(),
		destinationPlatform: z.string(),
		destinationStationName: z.string(),
		destinationTerminal: z.string(),

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
		destinationLocationTimeZone: z.string(),
		duration: z.number(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		entranceDescription: z.string(),

		eventEndDate: z.string(),
		eventName: z.string(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 *
		 * Shows a message in the live activity
		 * when the activity starts.
		 */
		eventLiveMessage: z.string(),

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

		eventStartDate: z.string(),

		eventType: z.enum([
			"PKEventTypeGeneric",
			"PKEventTypeLivePerformance",
			"PKEventTypeMovie",
			"PKEventTypeSports",
			"PKEventTypeConference",
			"PKEventTypeConvention",
			"PKEventTypeWorkshop",
			"PKEventTypeSocialGathering",
		]),
		flightCode: z.string(),
		flightNumber: z.number(),

		genre: z.string(),

		homeTeamAbbreviation: z.string(),
		homeTeamLocation: z.string(),
		homeTeamName: z.string(),

		/**
		 * @iOSVersion 26
		 *
		 * An optional boolean that indicates whether the passenger's international documents are verified. If set to `true` Wallet displays the badge on the boarding pass with the value from `internationalDocumentsVerifiedDeclarationName`.
		 */
		internationalDocumentsAreVerified: z.boolean(),

		/**
		 * @iOSVersion 26
		 *
		 * The name of the declaration given once the passenger's international documents are verified. Examples include `DOCS OK` or `Travel Ready`. If `internationalDocumentsAreVerified` is true, Wallet displays a badge on the boarding pass with this value.
		 */
		internationalDocumentsVerifiedDeclarationName: z.string(),

		/**
		 * The abbreviated league name for a sports event. Use this key only for a sports event ticket.
		 */
		leagueAbbreviation: z.string(),

		/**
		 * The unabbreviated league name for a sports event. Use this key only for a sports event ticket.
		 */
		leagueName: z.string(),

		/**
		 * @iOSVersion 26
		 *
		 * The MapKit Place IDs that reference the transit provider lounge locations. For more information, see [Identifying unique locations with Place IDs](https://developer.apple.com/documentation/MapKit/identifying-unique-locations-with-place-ids)
		 */
		loungePlaceIDs: z.array(z.string()),

		/**
		 * The name of a frequent flyer or loyalty program.
		 * Use this key for any type of boarding pass.
		 */

		membershipProgramName: z.string(),

		/**
		 * The ticketed passenger’s frequent flyer or loyalty number.
		 * Use this key for any type of boarding pass.
		 */
		membershipProgramNumber: z.string(),

		/**
		 * @iOSVersion 26
		 *
		 * The ticketed passenger’s frequent flyer or loyalty program status.
		 * Use this key for any type of boarding pass.
		 */
		membershipProgramStatus: z.string(),

		originalArrivalDate: z.string(),
		originalBoardingDate: z.string(),
		originalDepartureDate: z.string(),

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
		passengerAirlineSSRs: z.array(z.string()),

		/**
		 * @iOSVersion 26
		 *
		 * A list of capabilities the passenger has. Only use this key for airline boarding passes.
		 */

		passengerCapabilities: z.array(
			z.literal([
				"PKPassengerCapabilityPreboarding",
				"PKPassengerCapabilityPriorityBoarding",
				"PKPassengerCapabilityCarryon",
				"PKPassengerCapabilityPersonalItem",
			]),
		),
		/**
		 * @iOSVersion 26
		 *
		 * A list of security programs the passenger is eligible for. This only shows in the UI if a program is in `passengerEligibleSecurityPrograms` and at least one of `departureLocationSecurityPrograms` or `destinationLocationSecurityPrograms`.
		 */
		passengerEligibleSecurityPrograms: z.array(
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
		 * An array of IATA information SSRs that apply to the ticketed passenger. A comprehensive list of service SSRs can be found in the [IATA Airlines Developer Guide](https://guides.developer.iata.org/docs/21-1_ImplementationGuide.pdf) under A List of Information SSRs.
		 */
		passengerInformationSSRs: z.array(z.string()),

		/**
		 * @iOSVersion 26
		 *
		 * An array of IATA SSRs that apply to the ticketed passenger. A comprehensive list of service SSRs can be found in the [IATA Airlines Developer Guide](https://guides.developer.iata.org/docs/21-1_ImplementationGuide.pdf) under A List of Service SSRs.
		 */
		passengerServiceSSRs: z.array(z.string()),

		performerNames: z.array(z.string()),

		/**
		 * The priority status the ticketed passenger holds, such as `Gold` or `Silver`.
		 * Use this key for any type of boarding pass.
		 */
		priorityStatus: z.string(),

		playlistIDs: z.array(z.string()),

		seats: z.array(SemanticTagType.Seat),
		securityScreening: z.string(),
		silenceRequested: z.boolean(),
		sportName: z.string(),

		tailgatingAllowed: z.boolean(),

		/**
		 * @iOSVersion 26
		 *
		 * A localizable string that denotes the ticket class, such as `Saver`, `Economy`, `First`. This value displays as a badge on the boarding pass.
		 */
		ticketFareClass: z.string(),

		totalPrice: SemanticTagType.CurrencyAmount,

		/**
		 * The name of the transit company. Use this key for any type of boarding pass.
		 */
		transitProvider: z.string(),

		/**
		 * A brief description of the current boarding status for the vessel, such as `On Time` or `Delayed`.
		 * For delayed status, provide `currentBoardingDate`, `currentDepartureDate`, and `currentArrivalDate` where available.
		 * Use this key for any type of boarding pass.
		 */
		transitStatus: z.string(),

		/**
		 * A brief description that explains the reason for the current transitStatus, such as `Thunderstorms`.
		 * Use this key for any type of boarding pass.
		 */
		transitStatusReason: z.string(),

		vehicleName: z.string(),
		vehicleNumber: z.string(),
		vehicleType: z.string(),

		venueEntrance: z.string(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		venueGatesOpenDate: z.string(),

		venueLocation: SemanticTagType.Location,
		venueName: z.string(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		venueParkingLotsOpenDate: z.string(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		venueBoxOfficeOpenDate: z.string(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		venueDoorsOpenDate: z.string(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		venueFanZoneOpenDate: z.string(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		venueOpenDate: z.string(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		venueCloseDate: z.string(),

		venuePhoneNumber: z.string(),
		venueRoom: z.string(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		venueRegionName: z.string(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		venueEntranceGate: z.string(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		venueEntranceDoor: z.string(),

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 */
		venueEntrancePortal: z.string(),

		wifiAccess: z.array(SemanticTagType.WifiNetwork),
	})
	.partial();
