export * from "./Barcodes";
export * from "./Beacons";
export * from "./Location";
export * from "./PassFieldContent";
export * from "./NFC";
export * from "./SemanticTags";
export * from "./PassFields";
export * from "./Personalize";
export * from "./Certificates";

import Joi from "joi";

import { Barcode } from "./Barcodes";
import { Location } from "./Location";
import { Beacon } from "./Beacons";
import { NFC } from "./NFC";
import { PassFields, TransitType } from "./PassFields";
import { Semantics } from "./SemanticTags";
import { CertificatesSchema } from "./Certificates";

const RGB_COLOR_REGEX =
	/rgb\(\s*(?:[01]?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\s*,\s*(?:[01]?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\s*,\s*(?:[01]?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\s*\)/;

export interface FileBuffers {
	[key: string]: Buffer;
}

export interface PassProps {
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
	expirationDate?: string;
	locations?: Location[];

	boardingPass?: PassFields & { transitType: TransitType };
	eventTicket?: PassFields;
	coupon?: PassFields;
	generic?: PassFields;
	storeCard?: PassFields;
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
	| "expirationDate"
	| "locations";

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
	expirationDate: Joi.string().isoDate(),
	locations: Joi.array().items(Location),
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
	// parsing url as set of words and nums followed by dots, optional port and any possible path after
	webServiceURL: Joi.string().regex(
		/https?:\/\/(?:[a-z0-9]+\.?)+(?::\d{2,})?(?:\/[\S]+)*/,
	),
}).with("webServiceURL", "authenticationToken");

export const PassProps = Joi.object<
	OverridablePassProps & PassKindsProps & PassPropsFromMethods
>()
	.concat(OverridablePassProps)
	.concat(PassKindsProps)
	.concat(PassPropsFromMethods);

export interface Template {
	model: string;
	certificates: CertificatesSchema;
	props?: OverridablePassProps;
}

export const Template = Joi.object<Template>({
	model: Joi.string().required(),
	certificates: Joi.object().required(),
	props: OverridablePassProps,
});

// --------- UTILITIES ---------- //

/**
 * Checks if the passed options are compliant with the indicated schema
 * @param {any} opts - options to be checks
 * @param {string} schemaName - the indicated schema (will be converted)
 * @returns {boolean} - result of the check
 */

export function isValid<T extends Object>(
	opts: T,
	schema: Joi.ObjectSchema<T>,
): boolean {
	const validation = schema.validate(opts);

	if (validation.error) {
		throw new TypeError(validation.error.message);
	}

	return !validation.error;
}

/**
 * Performs validation of a schema on an object.
 * If it fails, will throw an error.
 *
 * @param schema
 * @param data
 */

export function assertValidity<T>(
	schema: Joi.ObjectSchema<T> | Joi.StringSchema,
	data: T,
): void {
	const validation = schema.validate(data);

	if (validation.error) {
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

	return source.reduce((acc, current) => {
		try {
			return [...acc, validate(schema, current)];
		} catch {
			return [...acc];
		}
	}, []);
}
