const Joi = require("joi");

const CONSTANTS = {
	instance: Joi.object().keys({
		modelDir: Joi.string().required(),
		modelName: Joi.string(),
		certificates: Joi.object().keys({
			dir: Joi.string().required(),
			wwdr: Joi.string().required(),
			signerCert: Joi.string().required(),
			signerKey: Joi.object().keys({
				keyFile: Joi.string().required(),
				passphrase: Joi.string().required(),
			}).required()
		}).required(),
		handlers: Joi.object().keys({
			barcode: Joi.func(),
			serialNumber: Joi.func()
		}),
		overrides: Joi.object()
	}),

	barcode: Joi.object().keys({
		altText: Joi.string(),
		messageEncoding: Joi.string(),
		format: Joi.string().required().regex(/(PKBarcodeFormatQR|PKBarcodeFormatPDF417|PKBarcodeFormatAztec|PKBarcodeFormatCode128)/, "barcodeType"),
		message: Joi.string().required()
	}),

};

module.exports = {
	CONSTANTS,
	isValid: (opts, schemaName) => {
		let validation = Joi.validate(opts, schemaName);
		return !validation.error;
	}
};
