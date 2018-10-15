let errors = {
	VALIDATION_FAILED: "Validation of pass type failed. Pass file is not a valid buffer or (more probabily) does not respect the schema. Refer to https://apple.co/2Nvshvn to build a correct pass.",
	UNINITIALIZED: "Provided model (%s) matched but unitialized or may not contain icon. Refer to https://apple.co/2IhJr0Q, https://apple.co/2Nvshvn and documentation to fill the model correctly.",
	REQS_NOT_MET: "The options passed to Pass constructor does not meet the requirements. Refer to the documentation to compile them correctly.",
	MODEL_NOT_STRING: "A string model name must be provided in order to continue.",
	MODEL_NOT_FOUND: "Model %s not found. Provide a valid one to continue",
	INVALID_CERTS: "Invalid certificate(s) loaded: %s. Please provide valid WWDR certificates and developer signer certificate and key (with passphrase). Refer to docs to obtain them.",
	INVALID_CERT_PATH: "Invalid certificate loaded. %s does not exist."
};

module.exports = errors;
