export * from "./Barcodes";
export * from "./Beacons";
export * from "./Location";
export * from "./PassFieldContent";
export * from "./NFC";
export * from "./SemanticTags";
export * from "./PassFields";
export * from "./Personalize";

import Joi from "joi";
import debug from "debug";

import { Barcode } from "./Barcodes";
import { Location } from "./Location";
import { Beacon } from "./Beacons";
import { NFC } from "./NFC";
import { Field } from "./PassFieldContent";
import { PassFields, TransitType } from "./PassFields";
import { Personalization } from "./Personalize";
import { Semantics } from "./SemanticTags";

const schemaDebug = debug("Schema");

export interface FileBuffers {
	[key: string]: Buffer;
}

/* export interface Certificates {
	wwdr?: string;
	signerCert?: string;
	signerKey?:
		| {
				keyFile: string;
				passphrase?: string;
		  }
		| string;
}*/

export interface CertificatesSchema {
	wwdr: string | Buffer;
	signerCert: string | Buffer;
	signerKey: string | Buffer;
	signerKeyPassphrase?: string;
}

export const CertificatesSchema = Joi.object<CertificatesSchema>()
	.keys({
		wwdr: Joi.alternatives(Joi.binary(), Joi.string()).required(),
		signerCert: Joi.alternatives(Joi.binary(), Joi.string()).required(),
		signerKey: Joi.alternatives(Joi.binary(), Joi.string()).required(),
		signerKeyPassphrase: Joi.string(),
	})
	.required();

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
	coupon: Joi.array().items(Field),
	generic: Joi.array().items(Field),
	storeCard: Joi.array().items(Field),
	eventTicket: Joi.array().items(Field),
	boardingPass: Joi.array().items(
		Field.concat(Joi.object({ transitType: TransitType })),
	),
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
	labelColor: Joi.string().min(10).max(16),
	authenticationToken: Joi.string().min(16),
	backgroundColor: Joi.string().min(10).max(16),
	foregroundColor: Joi.string().min(10).max(16),
	associatedStoreIdentifiers: Joi.array().items(Joi.number()),
	userInfo: Joi.alternatives(Joi.object().unknown(), Joi.array()),
	// parsing url as set of words and nums followed by dots, optional port and any possible path after
	webServiceURL: Joi.string().regex(
		/https?:\/\/(?:[a-z0-9]+\.?)+(?::\d{2,})?(?:\/[\S]+)*/,
	),
}).with("webServiceURL", "authenticationToken");

export const PassProps = Joi.object<
	OverridablePassProps & PassKindsProps & PassPropsFromMethods
>({
	...OverridablePassProps,
	...PassKindsProps,
	...PassPropsFromMethods,
});

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

type AvailableSchemas =
	| typeof Barcode
	| typeof Location
	| typeof Beacon
	| typeof NFC
	| typeof Field
	| typeof PassFields
	| typeof Personalization
	| typeof TransitType
	| typeof Template
	| typeof CertificatesSchema
	| typeof OverridablePassProps;

export type ArrayPassSchema = Beacon | Location | Barcode;

/* function resolveSchemaName(name: Schema) {
	return schemas[name] || undefined;
}
 */
/**
 * Checks if the passed options are compliant with the indicated schema
 * @param {any} opts - options to be checks
 * @param {string} schemaName - the indicated schema (will be converted)
 * @returns {boolean} - result of the check
 */

export function isValid(opts: any, schema: AvailableSchemas): boolean {
	if (!schema) {
		schemaDebug(
			`validation failed due to missing or mispelled schema name`,
		);
		return false;
	}

	const validation = schema.validate(opts);

	if (validation.error) {
		schemaDebug(
			`validation failed due to error: ${validation.error.message}`,
		);
	}

	return !validation.error;
}

/**
 * Executes the validation in verbose mode, exposing the value or an empty object
 * @param {object} opts - to be validated
 * @param {*} schemaName - selected schema
 * @returns {object} the filtered value or empty object
 */

export function getValidated<T extends Object>(
	opts: T,
	schema: AvailableSchemas,
): T | null {
	if (!schema) {
		schemaDebug(`validation failed due to missing schema`);

		return null;
	}

	const validation = schema.validate(opts, { stripUnknown: true });

	if (validation.error) {
		schemaDebug(
			`Validation failed in getValidated due to error: ${validation.error.message}`,
		);
		return null;
	}

	return validation.value;
}

export function filterValid<T extends Object>(
	source: T[],
	schema: AvailableSchemas,
): T[] {
	if (!source) {
		return [];
	}

	return source.reduce((acc, current) => {
		const validation = getValidated(current, schema);

		if (!validation) {
			return acc;
		}

		return [...acc, validation];
	}, []);
}
