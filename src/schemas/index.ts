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

export interface Manifest {
	[key: string]: string;
}

export interface Certificates {
	wwdr?: string;
	signerCert?: string;
	signerKey?:
		| {
				keyFile: string;
				passphrase?: string;
		  }
		| string;
}

export interface FactoryOptions {
	model: BundleUnit | string;
	certificates: Certificates;
	overrides?: OverridesSupportedOptions;
}

export interface BundleUnit {
	[key: string]: Buffer;
}

export interface PartitionedBundle {
	bundle: BundleUnit;
	l10nBundle: {
		[key: string]: BundleUnit;
	};
}

export interface CertificatesSchema {
	wwdr: string;
	signerCert: string;
	signerKey: string;
}

export const CertificatesSchema = Joi.object<CertificatesSchema>()
	.keys({
		wwdr: Joi.alternatives(Joi.binary(), Joi.string()).required(),
		signerCert: Joi.alternatives(Joi.binary(), Joi.string()).required(),
		signerKey: Joi.alternatives()
			.try(
				Joi.object().keys({
					keyFile: Joi.alternatives(
						Joi.binary(),
						Joi.string(),
					).required(),
					passphrase: Joi.string().required(),
				}),
				Joi.alternatives(Joi.binary(), Joi.string()),
			)
			.required(),
	})
	.required();

export interface PassInstance {
	model: PartitionedBundle;
	certificates: CertificatesSchema;
	overrides?: OverridesSupportedOptions;
}

export const PassInstance = Joi.object<PassInstance>().keys({
	model: Joi.alternatives(Joi.object(), Joi.string()).required(),
	certificates: Joi.object(),
	overrides: Joi.object(),
});

export interface OverridesSupportedOptions {
	serialNumber?: string;
	description?: string;
	organizationName?: string;
	passTypeIdentifier?: string;
	teamIdentifier?: string;
	appLaunchURL?: string;
	associatedStoreIdentifiers?: Array<number>;
	userInfo?: { [key: string]: any };
	webServiceURL?: string;
	authenticationToken?: string;
	sharingProhibited?: boolean;
	backgroundColor?: string;
	foregroundColor?: string;
	labelColor?: string;
	groupingIdentifier?: string;
	suppressStripShine?: boolean;
	logoText?: string;
	maxDistance?: number;
	semantics?: Semantics;
}

export const OverridesSupportedOptions = Joi.object<OverridesSupportedOptions>()
	.keys({
		serialNumber: Joi.string(),
		description: Joi.string(),
		organizationName: Joi.string(),
		passTypeIdentifier: Joi.string(),
		teamIdentifier: Joi.string(),
		appLaunchURL: Joi.string(),
		associatedStoreIdentifiers: Joi.array().items(Joi.number()),
		userInfo: Joi.alternatives(Joi.object().unknown(), Joi.array()),
		// parsing url as set of words and nums followed by dots, optional port and any possible path after
		webServiceURL: Joi.string().regex(
			/https?:\/\/(?:[a-z0-9]+\.?)+(?::\d{2,})?(?:\/[\S]+)*/,
		),
		authenticationToken: Joi.string().min(16),
		sharingProhibited: Joi.boolean(),
		backgroundColor: Joi.string().min(10).max(16),
		foregroundColor: Joi.string().min(10).max(16),
		labelColor: Joi.string().min(10).max(16),
		groupingIdentifier: Joi.string(),
		suppressStripShine: Joi.boolean(),
		logoText: Joi.string(),
		maxDistance: Joi.number().positive(),
		semantics: Semantics,
	})
	.with("webServiceURL", "authenticationToken");

export interface ValidPassType {
	boardingPass?: PassFields & { transitType: TransitType };
	eventTicket?: PassFields;
	coupon?: PassFields;
	generic?: PassFields;
	storeCard?: PassFields;
}

interface PassInterfacesProps {
	barcode?: Barcode;
	barcodes?: Barcode[];
	beacons?: Beacon[];
	locations?: Location[];
	maxDistance?: number;
	relevantDate?: string;
	nfc?: NFC;
	expirationDate?: string;
	voided?: boolean;
}

type AllPassProps = PassInterfacesProps &
	ValidPassType &
	OverridesSupportedOptions;
export type ValidPass = {
	[K in keyof AllPassProps]: AllPassProps[K];
};
export type PassColors = Pick<
	OverridesSupportedOptions,
	"backgroundColor" | "foregroundColor" | "labelColor"
>;

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
	| typeof PassInstance
	| typeof CertificatesSchema
	| typeof OverridesSupportedOptions;

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
