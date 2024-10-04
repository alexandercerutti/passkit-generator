export * from "./Barcode";
export * from "./Beacon";
export * from "./Location";
export * from "./Field";
export * from "./NFC";
export * from "./Semantics";
export * from "./PassFields";
export * from "./Personalize";
export * from "./Certificates";

import Joi from "joi";
import { Buffer } from "buffer";

import { Barcode } from "./Barcode";
import { Location } from "./Location";
import { Beacon } from "./Beacon";
import { NFC } from "./NFC";
import { PassFields, TransitType } from "./PassFields";
import { Semantics } from "./Semantics";
import { CertificatesSchema } from "./Certificates";

import * as Messages from "../messages";

const RGB_COLOR_REGEX =
	/rgb\(\s*(?:[01]?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\s*,\s*(?:[01]?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\s*,\s*(?:[01]?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\s*\)/;

const URL_REGEX = /https?:\/\/(?:[a-z0-9]+\.?)+(?::\d{2,})?(?:\/[\S]+)*/;

export type PreferredStyleSchemes = ("posterEventTicket" | "eventTicket")[];

export const PreferredStyleSchemes = Joi.array().items(
	"posterEventTicket",
	"eventTicket",
) satisfies Joi.Schema<PreferredStyleSchemes>;

/**
 * For newly-introduced event tickets
 * in iOS 18
 */

interface RelevantDate {
	startDate: string;
	endDate: string;
}

/**
 * Minimum supported version: iOS 18
 */

const RelevantDate = Joi.object<RelevantDate>().keys({
	startDate: Joi.string().required(),
	endDate: Joi.string().required(),
});


export interface FileBuffers {
	[key: string]: Buffer;
}

export interface PassProps {
	formatVersion?: 1;
	serialNumber?: string;
	description?: string;
	organizationName?: string;
	passTypeIdentifier?: string;
	teamIdentifier?: string;
	appLaunchURL?: string;
	voided?: boolean;
	userInfo?: { [key: string]: any };
	sharingProhibited?: boolean;
	groupingIdentifier?: string;
	suppressStripShine?: boolean;
	logoText?: string;
	maxDistance?: number;
	semantics?: Semantics;

	webServiceURL?: string;
	associatedStoreIdentifiers?: Array<number>;
	authenticationToken?: string;

	backgroundColor?: string;
	foregroundColor?: string;
	labelColor?: string;

	nfc?: NFC;
	beacons?: Beacon[];
	barcodes?: Barcode[];
	relevantDate?: string;

	relevantDates?: RelevantDate[];

	expirationDate?: string;
	locations?: Location[];

	boardingPass?: PassFields & { transitType: TransitType };
	eventTicket?: PassFields;
	coupon?: PassFields;
	generic?: PassFields;
	storeCard?: PassFields;

	/**
	 * New field for iOS 18
	 * Event Ticket
	 */
	preferredStyleSchemes?: PreferredStyleSchemes;

	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	bagPolicyURL?: string;

	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	orderFoodURL?: string;

	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	parkingInformationURL?: string;

	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	directionsInformationURL?: string;

	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	contactVenueEmail?: string;

	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	contactVenuePhoneNumber?: string;
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	contactVenueWebsite?: string;
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	purchaseParkingURL?: string;
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	merchandiseURL?: string;
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	transitInformationURL?: string;
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	accessibilityURL?: string;
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	addOnURL?: string;

	/**
	 * New field for iOS 18 Event Ticket.
	 * Will add a button among options near "share"
	 */
	transferURL?: string;

	/**
	 * New field for iOS 18 Event Ticket.
	 * Will add a button among options near "share"
	 */
	sellURL?: string;
}

/**
 * These are the properties passkit-generator will
 * handle through its methods
 */

type PassMethodsProps =
	| "nfc"
	| "beacons"
	| "barcodes"
	| "relevantDate"
	| "relevantDates"
	| "expirationDate"
	| "locations"
	| "preferredStyleSchemes";

export type PassTypesProps =
	| "boardingPass"
	| "eventTicket"
	| "coupon"
	| "generic"
	| "storeCard";

export type OverridablePassProps = Omit<
	PassProps,
	PassMethodsProps | PassTypesProps
>;
export type PassPropsFromMethods = { [K in PassMethodsProps]: PassProps[K] };
export type PassKindsProps = { [K in PassTypesProps]: PassProps[K] };

export type PassColors = Pick<
	OverridablePassProps,
	"backgroundColor" | "foregroundColor" | "labelColor"
>;

export const PassPropsFromMethods = Joi.object<PassPropsFromMethods>({
	nfc: NFC,
	beacons: Joi.array().items(Beacon),
	barcodes: Joi.array().items(Barcode),
	relevantDate: Joi.string().isoDate(),
	relevantDates: Joi.array().items(RelevantDate),
	expirationDate: Joi.string().isoDate(),
	locations: Joi.array().items(Location),
	preferredStyleSchemes: PreferredStyleSchemes,
});

export const PassKindsProps = Joi.object<PassKindsProps>({
	coupon: PassFields.disallow("transitType"),
	generic: PassFields.disallow("transitType"),
	storeCard: PassFields.disallow("transitType"),
	eventTicket: PassFields.disallow("transitType"),
	boardingPass: PassFields,
});

export const PassType = Joi.string().regex(
	/(boardingPass|coupon|eventTicket|storeCard|generic)/,
);

export const OverridablePassProps = Joi.object<OverridablePassProps>({
	formatVersion: Joi.number().default(1),
	semantics: Semantics,
	voided: Joi.boolean(),
	logoText: Joi.string(),
	description: Joi.string(),
	serialNumber: Joi.string(),
	appLaunchURL: Joi.string(),
	teamIdentifier: Joi.string(),
	organizationName: Joi.string(),
	passTypeIdentifier: Joi.string(),
	sharingProhibited: Joi.boolean(),
	groupingIdentifier: Joi.string(),
	suppressStripShine: Joi.boolean(),
	maxDistance: Joi.number().positive(),
	authenticationToken: Joi.string().min(16),
	labelColor: Joi.string().regex(RGB_COLOR_REGEX),
	backgroundColor: Joi.string().regex(RGB_COLOR_REGEX),
	foregroundColor: Joi.string().regex(RGB_COLOR_REGEX),
	associatedStoreIdentifiers: Joi.array().items(Joi.number()),
	userInfo: Joi.alternatives(Joi.object().unknown(), Joi.array()),
	webServiceURL: Joi.string().regex(URL_REGEX),

	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	bagPolicyURL: Joi.string().regex(URL_REGEX),
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	orderFoodURL: Joi.string().regex(URL_REGEX),
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	parkingInformationURL: Joi.string().regex(URL_REGEX),
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	directionsInformationURL: Joi.string(),
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	contactVenueEmail: Joi.string(),
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	contactVenuePhoneNumber: Joi.string(),
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	contactVenueWebsite: Joi.string(),
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	purchaseParkingURL: Joi.string(),
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	merchandiseURL: Joi.string(),
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	transitInformationURL: Joi.string(),
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	accessibilityURL: Joi.string(),
	
	/**
	 * New field for iOS 18 Event Ticket.
	 * @domain event guide
	 *
	 * To show buttons in the event guide,
	 * at least two among those marked with
	 * "@domain event guide" must be used.
	 */
	addOnURL: Joi.string(),

	/**
	 * New field for iOS 18 Event Ticket.
	 * Will add a button among options near "share"
	 */
	transferURL: Joi.string(),

	/**
	 * New field for iOS 18 Event Ticket.
	 * Will add a button among options near "share"
	 */
	sellURL: Joi.string(),
}).with("webServiceURL", "authenticationToken");

export const PassProps = Joi.object<
	OverridablePassProps & PassKindsProps & PassPropsFromMethods
>()
	.concat(OverridablePassProps)
	.concat(PassKindsProps)
	.concat(PassPropsFromMethods);

export interface Template {
	model: string;
	certificates?: CertificatesSchema;
}

export const Template = Joi.object<Template>({
	model: Joi.string().required(),
	certificates: Joi.object().required(),
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
	schema: Joi.ObjectSchema<T> | Joi.StringSchema | Joi.Schema<T>,
	data: T,
	customErrorMessage?: string,
): void {
	const validation = schema.validate(data);

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
 * @param options
 * @returns
 */

export function validate<T extends Object>(
	schema: Joi.ObjectSchema<T> | Joi.StringSchema,
	options: T,
): T {
	const validationResult = schema.validate(options, {
		stripUnknown: true,
		abortEarly: true,
	});

	if (validationResult.error) {
		throw validationResult.error;
	}

	return validationResult.value;
}

export function filterValid<T extends Object>(
	schema: Joi.ObjectSchema<T>,
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
