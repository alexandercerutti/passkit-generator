let errors = {
	VALIDATION_FAILED: "Validation of pass type failed. Pass file is not a valid buffer or (more probabily) does not respect the schema. Refer to https://apple.co/2Nvshvn to build a correct pass.",
	UNINITIALIZED: "Provided model (%s) matched but unitialized or may not contain icon. Refer to https://apple.co/2IhJr0Q, https://apple.co/2Nvshvn and documentation to fill the model correctly.",
	MANIFEST_TYPE: "Manifest content must be a string or an object. Unable to accept manifest of type %s",
	REQS_NOT_MET: "The options passed to Pass constructor does not meet the requirements. Refer to the documentation to compile them correctly.",
	MODEL_NOT_STRING: "A string model name must be provided in order to continue.",
	MODEL_NOT_FOUND: "Model %s not found. Provide a valid one to continue",
	INVALID_CERTS: "Invalid certificates got loaded. Please provide WWDR certificates and developer signer certificate and key (with passphrase)."
};

let warnings = {
	BARCODE_SYNREM: "\x1b[41mBarcode syntax of the chosen model (%s) is not correct and got removed or the override content was not provided. Please refer to https://apple.co/2myAbst.\x1b[0m",
	BARCODES_SYNREM: "\x1b[41mBarcode @ index %s of the chosen model (%s) is not well-formed or have syntax errors and got removed. Please refer to https://apple.co/2myAbst.\x1b[0m",
	BARCODE_INCOMP8: "\x1b[33mYour pass model (%s) is not compatible with iOS versions lower than iOS 9. Please refer to https://apple.co/2O5K65k to make it backward-compatible.\x1b[0m",
	BARCODE_INCOMP9: "\x1b[33mYour pass model (%s) is not compatible with iOS versions greater than iOS 8. Refer to https://apple.co/2O5K65k to make it forward-compatible.\x1b[0m",
	BARCODE_NOT_SPECIFIED: "\x1b[33mNo barcodes support specified. The element got removed.\x1b[0m"
};

module.exports = { errors, warnings };