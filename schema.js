const Joi = require("joi");

let instance = Joi.object().keys({
	model: Joi.string(),
	certificates: Joi.object().keys({
		wwdr: Joi.string().required(),
		signerCert: Joi.string().required(),
		signerKey: Joi.object().keys({
			keyFile: Joi.string().required(),
			passphrase: Joi.string().required(),
		}).required()
	}).required(),
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
});

let struct = {
	auxiliaryFields: Joi.array().items(field),
	backFields: Joi.array().items(field),
	headerFields: Joi.array().items(field),
	primaryFields: Joi.array().items(field),
	secondaryFields: Joi.array().items(field)
};

let basicStructure = Joi.object().keys(struct);
let boardingStructure = Joi.object().keys(Object.assign({
	transitType: Joi.string().regex(/(PKTransitTypeAir|PKTransitTypeBoat|PKTransitTypeBus|PKTransitTypeGeneric|PKTransitTypeTrain)/).required()
}, struct));

module.exports = {
	constants: {
		instance,
		barcode,
		field,
		basicStructure,
		boardingStructure
	},
	isValid: (opts, schemaName, debug = false) => {
		let validation = Joi.validate(opts, schemaName);

		if (debug) {
			console.log(validation)
		}

		return !validation.error;
	}
};
