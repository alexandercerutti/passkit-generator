let errors = {
	PASSFILE_VALIDATION_FAILED: "Validation of pass type failed. Pass file is not a valid buffer or (more probabily) does not respect the schema. Refer to https://apple.co/2Nvshvn to build a correct pass.",
	REQUIR_VALID_FAILED: "The options passed to Pass constructor does not meet the requirements. Refer to the documentation to compile them correctly.",
	MODEL_UNINITIALIZED: "Provided model ( %s ) matched but unitialized or may not contain icon. Refer to https://apple.co/2IhJr0Q, https://apple.co/2Nvshvn and documentation to fill the model correctly.",
	MODEL_NOT_STRING: "A string model name must be provided in order to continue.",
	MODEL_NOT_FOUND: "Model %s not found. Provide a valid one to continue.",
	INVALID_CERTS: "Invalid certificate(s) loaded: %s. Please provide valid WWDR certificates and developer signer certificate and key (with passphrase). Refer to docs to obtain them.",
	INVALID_CERT_PATH: "Invalid certificate loaded. %s does not exist."
};

function format(errorName, ...values) {
	// reversing because it is better popping than shifting.
	let replaceValues = values.reverse();
	return resolveErrorName(errorName).replace(/%s/, () => {
		let next = replaceValues.pop();
		return next !== undefined ? next : "<passedValueIsUndefined>";
	});
}

function resolveErrorName(name) {
	if (!errors[name]) {
		return `<ErrorName ${name} is not linked to any error messages>`;
	}

	return errors[name];
}

module.exports = format;
