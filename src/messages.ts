interface MessageGroup {
	[key: string]: string;
}

const errors: MessageGroup = {
	CP_INIT_ERROR: "Something went really bad in the %s initialization! Look at the log below this message. It should contain all the infos about the problem: \n%s",
	CP_NO_OPTS: "Cannot initialize the pass or abstract model creation: no options were passed.",
	CP_NO_CERTS: "Cannot initialize the pass creation: no valid certificates were passed.",
	PASSFILE_VALIDATION_FAILED: "Validation of pass type failed. Pass file is not a valid buffer or (more probably) does not respect the schema.\nRefer to https://apple.co/2Nvshvn to build a correct pass.",
	REQUIR_VALID_FAILED: "The options passed to Pass constructor does not meet the requirements.\nRefer to the documentation to compile them correctly.",
	MODEL_UNINITIALIZED: "Provided model ( %s ) matched but unitialized or may not contain icon or a valid pass.json.\nRefer to https://apple.co/2IhJr0Q, https://apple.co/2Nvshvn and documentation to fill the model correctly.",
	MODEL_NOT_VALID: "A model must be provided in form of path (string) or object { 'fileName': Buffer } in order to continue.",
	MODELF_NOT_FOUND: "Model %s not found. Provide a valid one to continue.",
	MODELF_FILE_NOT_FOUND: "File %s not found.",
	INVALID_CERTS: "Invalid certificate(s) loaded: %s. Please provide valid WWDR certificates and developer signer certificate and key (with passphrase).\nRefer to docs to obtain them.",
	INVALID_CERT_PATH: "Invalid certificate loaded. %s does not exist.",
	TRSTYPE_REQUIRED: "Cannot proceed with pass creation. transitType field is required for boardingPasses.",
	OVV_KEYS_BADFORMAT: "Cannot proceed with pass creation due to bad keys format in overrides.",
	NO_PASS_TYPE: "Cannot proceed with pass creation. Model definition (pass.json) has no valid type in it.\nRefer to https://apple.co/2wzyL5J to choose a valid pass type."
};

const debugMessages: MessageGroup = {
	TRSTYPE_NOT_VALID: "Transit type changing rejected as not compliant with Apple Specifications. Transit type would become \"%s\" but should be in [PKTransitTypeAir, PKTransitTypeBoat, PKTransitTypeBus, PKTransitTypeGeneric, PKTransitTypeTrain]",
	BRC_NOT_SUPPORTED: "Format not found among barcodes. Cannot set backward compatibility.",
	BRC_FORMATTYPE_UNMATCH: "Format must be a string or null. Cannot set backward compatibility.",
	BRC_AUTC_MISSING_DATA: "Unable to autogenerate barcodes. Data is not a string.",
	BRC_BW_FORMAT_UNSUPPORTED: "This format is not supported (by Apple) for backward support. Please choose another one.",
	BRC_NO_POOL: "Cannot set barcode: no barcodes found. Please set barcodes first. Barcode is for retrocompatibility only.",
	DATE_FORMAT_UNMATCH: "%s was not set due to incorrect date format.",
	NFC_INVALID: "Unable to set NFC properties: data not compliant with schema.",
	PRS_INVALID: "Unable to parse Personalization.json. File is not a valid JSON. Error: %s",
	PRS_REMOVED: "Personalization has been removed as it requires an NFC-enabled pass to work."
};

/**
 * Creates a message with replaced values
 * @param {string} messageName
 * @param  {any[]} values
 */

export default function format(messageName: string, ...values: any[]) {
	// reversing because it is better popping than shifting.
	let replaceValues = values.reverse();
	return resolveMessageName(messageName).replace(/%s/g, () => {
		let next = replaceValues.pop();
		return next !== undefined ? next : "<passedValueIsUndefined>";
	});
}

/**
 * Looks among errors and debugMessages for the specified message name
 * @param {string} name
 */

function resolveMessageName(name: string): string {
	if (!errors[name] && !debugMessages[name]) {
		return `<ErrorName "${name}" is not linked to any error messages>`;
	}

	return errors[name] || debugMessages[name];
}
