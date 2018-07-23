const Joi = require("joi");

let instance = Joi.object().keys({
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
});

let barcode = Joi.object().keys({
	altText: Joi.string(),
	messageEncoding: Joi.string(),
	format: Joi.string().required().regex(/(PKBarcodeFormatQR|PKBarcodeFormatPDF417|PKBarcodeFormatAztec|PKBarcodeFormatCode128)/, "barcodeType"),
	message: Joi.string().required()
});

let field = Joi.object().keys({
	attributedValue: Joi.string(),
	changeMessage: Joi.string(),
	dataDetectorType: Joi.array().items(Joi.string().regex(/(PKDataDetectorTypePhoneNumber|PKDataDetectorTypeLink|PKDataDetectorTypeAddress|PKDataDetectorTypeCalendarEvent)/, "dataDetectorType")),
	label: Joi.string(),
	textAlignment: Joi.string().regex(/(PKTextAlignmentLeft|PKTextAlignmentCenter|PKTextAlignmentRight|PKTextAlignmentNatural)/, "graphic-alignment"),
	key: Joi.string().required(),
	value: Joi.string().required()
})

let structure = Joi.object().keys({
	auxiliaryFields: Joi.array().items(field),
	backFields: Joi.array().items(field),
	headerFields: Joi.array().items(field),
	primaryFields: Joi.array().items(field),
	secondaryFields: Joi.array().items(field),
	transitType: Joi.string().regex(/(PKTransitTypeAir|PKTransitTypeBoat|PKTransitTypeBus|PKTransitTypeGeneric|PKTransitTypeTrain)/)
});

module.exports = {
	constants: {
		instance,
		barcode,
		field,
		structure
	},
	isValid: (opts, schemaName) => {
		let validation = Joi.validate(opts, schemaName);
		return !validation.error;
	}
};
