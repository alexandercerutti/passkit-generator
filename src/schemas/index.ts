export * from "./Barcode.js";
export * from "./Beacon.js";
export * from "./Location.js";
export * from "./PassFieldContent.js";
export * from "./NFC.js";
export * from "./Semantics.js";
export * from "./PassFields.js";
export * from "./Personalize.js";
export * from "./Certificates.js";
export * from "./UpcomingPassInformation.js";

import { z } from "zod";
import type { Buffer } from "node:buffer";

import { Barcode } from "./Barcode.js";
import { Location } from "./Location.js";
import { Beacon } from "./Beacon.js";
import { NFC } from "./NFC.js";
import { PassFields } from "./PassFields.js";
import { Semantics } from "./Semantics.js";
import { CertificatesSchema } from "./Certificates.js";
import { UpcomingPassInformationEntry } from "./UpcomingPassInformation.js";

import * as Messages from "../messages.js";
import { RGB_HEX_COLOR_REGEX } from "./regexps.js";

const httpAddressSchema = z.url({
	protocol: /^https?$/,
});
const dateTimeSchema = z.iso.datetime({
	offset: true,
	local: true,
});

/**
 * @iOSVersion 18
 */
const PosterEventTicketSchemes = z.literal([
	"posterEventTicket",
	"eventTicket",
]);

/**
 * @iOSVersion 26
 */
const BoardingPassSchemes = z.literal(["boardingPass", "semanticBoardingPass"]);

/**
 * @iOSVersion 18
 */
export type PreferredStyleSchemes = z.infer<typeof PreferredStyleSchemes>;

export const PreferredStyleSchemes = z.array(
	z.union([BoardingPassSchemes, PosterEventTicketSchemes]),
);

/**
 * @iOSVersion 18 => "relevantDate"
 * @iOSVersion 26 => "date"
 */
export type RelevancyEntry = z.infer<typeof RelevancyEntry>;

export const RelevancyEntry = z.union([
	z.object({
		/**
		 * Since iOS 26
		 */
		date: dateTimeSchema,

		/**
		 * Since iOS 18, then was renamed in
		 * 'date' in iOS 26 (what a breaking change)
		 */
		relevantDate: dateTimeSchema.optional(),
	}),
	z.object({
		/**
		 * Since iOS 26
		 */
		date: dateTimeSchema.optional(),

		/**
		 * Since iOS 18, then was renamed in
		 * 'date' in iOS 26 (what a breaking change)
		 */
		relevantDate: dateTimeSchema,
	}),
]);

/**
 * A single interval can span at most 24 hours
 */
export type RelevancyInterval = z.infer<typeof RelevancyInterval>;

export const RelevancyInterval = z.object({
	startDate: dateTimeSchema,
	endDate: dateTimeSchema,
});

/**
 * @iOSVersion 18
 *
 * Using a RelevancyInterval, will trigger a live activity on
 * new event ticket passes.
 *
 * Using a RelevancyEntry, will match the behavior of the
 * currently deprecated property `relevantDate`.
 */

export type RelevantDate = z.infer<typeof RelevantDate>;

export const RelevantDate = z.union([
	//
	RelevancyInterval,
	RelevancyEntry,
]);

export interface FileBuffers {
	[key: string]: Buffer;
}

// ***************** //
// *** PASS TYPE *** //
// ***************** //

export type PassType = z.infer<typeof PassType>;

export const PassType = z.literal([
	"boardingPass",
	"coupon",
	"eventTicket",
	"storeCard",
	"generic",
]);

/**
 * @deprecated use PassType instead
 */
export type PassTypesProps = PassType;

// ************************ //
// *** COLOR PROPERTIES *** //
// ************************ //

export type PassColors = z.infer<typeof PassColors>;

export const PassColors = z.object({
	backgroundColor: z.string().check(z.regex(RGB_HEX_COLOR_REGEX)).optional(),
	foregroundColor: z.string().check(z.regex(RGB_HEX_COLOR_REGEX)).optional(),
	labelColor: z.string().check(z.regex(RGB_HEX_COLOR_REGEX)).optional(),
	stripColor: z.string().check(z.regex(RGB_HEX_COLOR_REGEX)).optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * @description
	 *
	 * By default, the chin is colored with a
	 * blur. Through this option, it is possible
	 * to specify a different and specific color
	 * for it.
	 */
	footerBackgroundColor: z
		.string()
		.check(z.regex(RGB_HEX_COLOR_REGEX))
		.optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 *
	 * @description
	 *
	 * Enables the automatic calculation of the
	 * `foregroundColor` and `labelColor` based
	 * on the background image in the new event
	 * ticket passes.
	 *
	 * If enabled, `foregroundColor` and `labelColor`
	 * are ignored.
	 */
	useAutomaticColors: z.boolean().optional(),
});

// ******************************* //
// *** PROPERTIES FROM METHODS *** //
// ******************************* //

export type PassPropsFromMethods = z.infer<typeof PassPropsFromMethods>;

export const PassPropsFromMethods = z.object({
	nfc: NFC.optional(),
	beacons: z.array(Beacon).optional(),
	barcodes: z.array(Barcode).optional(),
	/**
	 * @deprecated since iOS 18. Use `relevantDates` instead.
	 */
	relevantDate: dateTimeSchema.optional(),
	relevantDates: z.array(RelevantDate).optional(),
	expirationDate: dateTimeSchema.optional(),
	locations: z.array(Location).optional(),
	preferredStyleSchemes: PreferredStyleSchemes.optional(),
	upcomingPassInformation: z.array(UpcomingPassInformationEntry).optional(),
});

// ***************************** //
// *** PASS TYPE WITH FIELDS *** //
// ***************************** //

export type PassTypesFields = z.infer<typeof PassTypesFields>;

export const PassTypesFields = z.object({
	coupon: PassFields.omit({
		transitType: true,
		additionalInfoFields: true,
	}).optional(),
	generic: PassFields.omit({
		transitType: true,
		additionalInfoFields: true,
	}).optional(),
	storeCard: PassFields.omit({
		transitType: true,
		additionalInfoFields: true,
	}).optional(),
	eventTicket: PassFields.omit({
		transitType: true,
	}).optional(),
	boardingPass: PassFields.omit({
		additionalInfoFields: true,
	}).optional(),
});

/**
 * @deprecated use `PassTypesFields` instead
 */
export type PassKindProps = PassTypesFields;

// *********************************** //
// *** OVERRIDABLE PASS PROPERTIES *** //
// *********************************** //

export type OverridablePassProps = z.infer<typeof OverridablePassProps>;

export const OverridablePassProps = z.union([
	PassColors,
	z
		.object({
			formatVersion: z.number().default(1).optional(),
			passTypeIdentifier: z.string(),
			teamIdentifier: z.string(),
			organizationName: z.string(),
			semantics: Semantics.optional(),
			voided: z.boolean().optional(),
			logoText: z.string().optional(),
			description: z.string().optional(),
			serialNumber: z.string().optional(),
			appLaunchURL: httpAddressSchema.optional(),
			sharingProhibited: z.boolean().optional(),
			groupingIdentifier: z.string().optional(),
			suppressStripShine: z.boolean().optional(),
			maxDistance: z.number().positive().optional(),
			authenticationToken: z.string().min(16).optional(),
			associatedStoreIdentifiers: z.array(z.number()).optional(),
			userInfo: z.record(z.string(), z.json()).optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 * @passDomain Event Guide
			 *
			 * To show buttons in the event guide,
			 * at least two among those marked with
			 * "@passDomain Event Guide" must be used.
			 */
			bagPolicyURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle posterEventTicket, semanticBoardingPasses
			 * @passDomain Event Guide, Semantic Boarding Passes
			 *
			 * To show buttons in the event guide,
			 * at least two among those marked with
			 * "@passDomain Event Guide" must be used.
			 */
			orderFoodURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 * @passDomain Event Guide
			 *
			 * To show buttons in the event guide,
			 * at least two among those marked with
			 * "@passDomain Event Guide" must be used.
			 */
			parkingInformationURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 * @passDomain Event Guide
			 *
			 * To show buttons in the event guide,
			 * at least two among those marked with
			 * "@passDomain Event Guide" must be used.
			 */
			directionsInformationURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 * @passDomain Event Guide
			 *
			 * @description
			 *
			 * URL to a resource to buy or access
			 * the parking spot.
			 *
			 * To show buttons in the event guide,
			 * at least two among those marked with
			 * "@passDomain Event Guide" must be used.
			 */
			purchaseParkingURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 * @passDomain Event Guide
			 *
			 * @description
			 *
			 * URL to a resource to buy the
			 * merchandise.
			 *
			 * To show buttons in the event guide,
			 * at least two among those marked with
			 * "@passDomain Event Guide" must be used.
			 */
			merchandiseURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 * @passDomain Event Guide
			 *
			 * @description
			 *
			 * URL to a resource about public or
			 * private transportation to reach the
			 * venue.
			 *
			 * To show buttons in the event guide,
			 * at least two among those marked with
			 * "@passDomain Event Guide" must be used.
			 */
			transitInformationURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 * @passDomain Event Guide
			 *
			 * @description
			 *
			 * URL to a resource about accessibility
			 * in the events venue.
			 *
			 * To show buttons in the event guide,
			 * at least two among those marked with
			 * "@passDomain Event Guide" must be used.
			 */
			accessibilityURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 * @passDomain Event Guide
			 *
			 * @description
			 *
			 * An URL to link experiences to the
			 * pass (upgrades and more).
			 *
			 * To show buttons in the event guide,
			 * at least two among those marked with
			 * "@passDomain Event Guide" must be used.
			 */
			addOnURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 * @passDomain Event Guide
			 *
			 * @description
			 *
			 * To show buttons in the event guide,
			 * at least two among those marked with
			 * "@passDomain Event Guide" must be used.
			 */
			contactVenueEmail: z.string().optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 * @passDomain Event Guide
			 *
			 * @description
			 *
			 * To show buttons in the event guide,
			 * at least two among those marked with
			 * "@passDomain Event Guide" must be used.
			 */
			contactVenuePhoneNumber: z.string().optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 * @passDomain Event Guide
			 *
			 * @description
			 *
			 * To show buttons in the event guide,
			 * at least two among those marked with
			 * "@passDomain Event Guide" must be used.
			 */
			contactVenueWebsite: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 *
			 * @description
			 *
			 * Will add a button among options near "share"
			 */
			transferURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 *
			 * @description
			 *
			 * Will add a button among options near "share"
			 */
			sellURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 *
			 * @description
			 *
			 * Will remove an automatic shadow in the new
			 * event ticket layouts.
			 */
			suppressHeaderDarkening: z.boolean().optional(),

			/**
			 * @iOSVersion 18
			 * @passStyle eventTicket (new layout)
			 *
			 * @description
			 *
			 * Applications AppStore Identifiers
			 * related to the event ticket.
			 *
			 * It is not mandatory for the app to
			 * be related to the pass issuer.
			 *
			 * Such applications won't be able to read
			 * the passes users has (probably differently
			 * by `associatedStoreIdentifiers`).
			 */
			auxiliaryStoreIdentifiers: z.array(z.number()).optional(),

			/**
			 * @iOSVersion 18.1
			 *
			 * The text to display next to the logo on posterEventTicket passes.
			 */
			eventLogoText: z.string().optional(),

			/**
			 * @iOSVersion 26
			 *
			 * @description
			 *
			 * A URL for changing the seat for the ticket.
			 * Available only with Enhanced (or semantic) Boarding Passes
			 */
			changeSeatURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 26
			 *
			 * @description
			 *
			 * A URL for in-flight entertainment.
			 * Available only with Enhanced (or semantic) Boarding Passes
			 */
			entertainmentURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 26
			 *
			 * @description
			 *
			 * A URL for adding checked bags for the ticket.
			 * Available only with Enhanced (or semantic) Boarding Passes
			 */
			purchaseAdditionalBaggageURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 26
			 *
			 * @description
			 *
			 * A URL that links to information to purchase lounge access.
			 * Available only with Enhanced (or semantic) Boarding Passes
			 */
			purchaseLoungeAccessURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 26
			 *
			 * @description
			 *
			 * A URL for purchasing in-flight wifi.
			 * Available only with Enhanced (or semantic) Boarding Passes
			 */
			purchaseWifiURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 26
			 *
			 * @description
			 *
			 * A URL for upgrading the flight.
			 * Available only with Enhanced (or semantic) Boarding Passes
			 */
			upgradeURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 26
			 *
			 * @description
			 *
			 * A URL for management.
			 * Available only with Enhanced (or semantic) Boarding Passes
			 */
			managementURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 26
			 *
			 * @description
			 *
			 * A URL for registering a service animal.
			 * Available only with Enhanced (or semantic) Boarding Passes
			 */
			registerServiceAnimalURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 26
			 *
			 * @description
			 *
			 * A URL to report a lost bag.
			 * Available only with Enhanced (or semantic) Boarding Passes
			 */
			reportLostBagURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 26
			 *
			 * @description
			 *
			 * A URL to request a wheel chair.
			 * Available only with Enhanced (or semantic) Boarding Passes
			 */
			requestWheelchairURL: httpAddressSchema.optional(),

			/**
			 * @iOSVersion 26
			 *
			 * @description
			 *
			 * The email for the transit provider.
			 * Available only with Enhanced (or semantic) Boarding Passes
			 */
			transitProviderEmail: z.string().optional(),

			/**
			 * @iOSVersion 26
			 *
			 * @description
			 *
			 * The phone number for the transit provider.
			 * Available only with Enhanced (or semantic) Boarding Passes
			 */
			transitProviderPhoneNumber: z.string().optional(),

			/**
			 * @iOSVersion 26
			 *
			 * @description
			 *
			 * The URL for the transit provider.
			 * Available only with Enhanced (or semantic) Boarding Passes
			 */
			transitProviderWebsiteURL: httpAddressSchema.optional(),
		})
		.and(
			z.union([
				z.object({
					webServiceURL: httpAddressSchema,
					authenticationToken: z.string().min(16),
				}),
				z.object({
					webServiceURL: z.never().optional(),
					authenticationToken: z.never().optional(),
				}),
			]),
		),
]);

// *************************** //
// *** ALL PASS PROPERTIES *** //
// *************************** //

export type PassProps = z.infer<typeof PassProps>;

export const PassProps = z.intersection(
	OverridablePassProps,
	z.intersection(PassTypesFields, PassPropsFromMethods),
);

// *********************** //
// *** TEMPLATE SCHEMA *** //
// *********************** //

export type Template = z.infer<typeof Template>;

export const Template = z.object({
	model: z.string(),
	certificates: CertificatesSchema.optional(),
});

// --------- UTILITIES ---------- //

/**
 * Performs validation of a schema on an object.
 * If it fails, will throw an error.
 *
 * @param schema
 * @param data
 */

export function assertValidity<T>(
	schema: z.ZodType<T>,
	data: T,
	customErrorMessage?: string,
): asserts data is T & {} {
	const validation = schema.safeParse(data);

	if (validation.error) {
		if (customErrorMessage) {
			console.warn(validation.error);
			throw new TypeError(
				`${validation.error.name} happened. ${Messages.format(
					customErrorMessage,
					validation.error.message,
				)}`,
			);
		}

		throw new TypeError(validation.error.message);
	}
}

/**
 * Performs validation and throws the error if there's one.
 * Otherwise returns a (possibly patched) version of the specified
 * options (it depends on the schema)
 *
 * @param schema
 * @param value
 * @returns
 */

export function validate<T extends Object>(schema: z.ZodType<T>, value: T): T {
	return schema.parse(value);
}

export function filterValid<T extends Object>(
	schema: z.ZodType<T>,
	source: T[],
): T[] {
	if (!source) {
		return [];
	}

	return source.reduce<T[]>((acc, current) => {
		try {
			return [...acc, validate(schema, current)];
		} catch (err) {
			console.warn(Messages.format(Messages.FILTER_VALID.INVALID, err));
			return [...acc];
		}
	}, []);
}
