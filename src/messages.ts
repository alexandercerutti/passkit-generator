export const INIT = {
	INVALID_BUFFERS:
		"Cannot set buffers in constructor: expected object but received %s",
} as const;

export const CERTIFICATES = {
	INVALID:
		"Invalid certificate(s) loaded. %s. Please provide valid WWDR certificates and developer signer certificate and key (with passphrase).\nRefer to docs to obtain them",
} as const;

export const TRANSIT_TYPE = {
	UNEXPECTED_PASS_TYPE:
		"Cannot set transitType on a pass with type different from boardingPass.",
	INVALID:
		"Cannot set transitType because not compliant with Apple specifications. Refer to https://apple.co/3DHuAG4 for more - %s",
} as const;

export const PREFERRED_STYLE_SCHEMES = {
	UNEXPECTED_PASS_TYPE_SET:
		"Cannot set preferredStyleSchemes on a pass with type different from eventTicket.",
	UNEXPECTED_PASS_TYPE_GET:
		"Cannot get preferredStyleSchemes on a pass with type different from eventTicket.",
	INVALID:
		"Cannot set preferredStyleSchemes because not compliant with Apple specifications - %s",
} as const;

export const PASS_TYPE = {
	INVALID:
		"Cannot set type because not compliant with Apple specifications. Refer to https://apple.co/3aFpSfg for a list of valid props - %s",
} as const;

export const TEMPLATE = {
	INVALID: "Cannot create pass from a template. %s",
} as const;

export const FILTER_VALID = {
	INVALID: "Cannot validate property. %s",
} as const;

export const FIELDS = {
	INVALID: "Cannot add field. %s",
	REPEATED_KEY:
		"Cannot add field with key '%s': another field already owns this key. Ignored.",
} as const;

export const DATE = {
	INVALID: "Cannot set %s. Invalid date %s",
} as const;

export const LANGUAGES = {
	INVALID_LANG:
		"Cannot set localization. Expected a string for 'lang' but received %s",
	NO_TRANSLATIONS:
		"Cannot create or use language %s. If your itention was to just add a language (.lproj) folder to the bundle, both specify some translations or use .addBuffer to add some media.",
} as const;

export const BARCODES = {
	INVALID_POST: "",
} as const;

export const PASS_SOURCE = {
	INVALID: "Cannot add pass.json to bundle because it is invalid. %s",
	UNKNOWN_TYPE:
		"Cannot find a valid type in pass.json. You won't be able to set fields until you won't set explicitly one.",
	JOIN: "The imported pass.json's properties will be joined with the current setted props. You might lose some data.",
} as const;

export const PERSONALIZE = {
	INVALID:
		"Cannot add personalization.json to bundle because it is invalid. %s",
} as const;

export const JSON = {
	INVALID: "Cannot parse JSON. Invalid file",
} as const;

export const CLOSE = {
	MISSING_TYPE: "Cannot proceed creating the pass because type is missing.",
	MISSING_ICON:
		"At least one icon file is missing in your bundle. Your pass won't be openable by any Apple Device.",
	PERSONALIZATION_REMOVED:
		"Personalization file '%s' have been removed from the bundle as the requirements for personalization are not met.",
	MISSING_TRANSIT_TYPE:
		"Cannot proceed creating the pass because transitType is missing on your boardingPass.",
} as const;

export const MODELS = {
	DIR_NOT_FOUND: "Cannot import model: directory %s not found.",
	FILE_NO_OPEN: "Cannot open model file. %s",
} as const;

export const BUNDLE = {
	MIME_TYPE_MISSING: "Cannot build Bundle. MimeType is missing",
	CLOSED: "Cannot add file or set property. Bundle is closed.",
} as const;

export const FROM = {
	MISSING_SOURCE: "Cannot create PKPass from source: source is '%s'",
} as const;

export const PACK = {
	INVALID: "Cannot pack passes. Only PKPass instances allowed",
} as const;

/**
 * Creates a message with replaced values
 * @param messageName
 * @param values
 */

export function format(messageName: string, ...values: any[]) {
	// reversing because it is better popping than shifting.
	const replaceValues = values.reverse();
	return messageName.replace(/%s/g, () => replaceValues.pop());
}
