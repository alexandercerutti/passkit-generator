const Joi = require("joi");
const debug = require("debug")("Schema");

let instance = Joi.object().keys({
	model: Joi.string().required(),
	certificates: Joi.object().keys({
		wwdr: Joi.string().required(),
		signerCert: Joi.string().required(),
		signerKey: Joi.object().keys({
			keyFile: Joi.string().required(),
			passphrase: Joi.string().required(),
		}).required()
	}).required(),
	overrides: Joi.object(),
	shouldOverwrite: Joi.boolean()
});

let supportedOptions = Joi.object().keys({
	serialNumber: Joi.string(),
	userInfo: Joi.alternatives(Joi.object().unknown(), Joi.array()),
	webServiceURL: Joi.string().regex(/^https?:\/\/(?:[a-z0-9]+\.[a-z0-9]+\.[a-z]+(?:\.[a-z]+)?|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/?(?:[a-z\/_%0-9A-Z.]+)?/),
	authenticationToken: Joi.string().token().min(16).when("webServiceURL", {
		is: Joi.exist(),
		then: Joi.required()
	}),
	sharingProhibited: Joi.boolean(),
	backgroundColor: Joi.string().min(10).max(16),
	foregroundColor: Joi.string().min(10).max(16),
	labelColor: Joi.string().min(10).max(16),
	groupingIdentifier: Joi.string(),
	suppressStripShine: Joi.boolean()
});

let barcode = Joi.object().keys({
	altText: Joi.string(),
	messageEncoding: Joi.string().default("iso-8859-1"),
	format: Joi.string().required().regex(/(PKBarcodeFormatQR|PKBarcodeFormatPDF417|PKBarcodeFormatAztec|PKBarcodeFormatCode128)/, "barcodeType"),
	message: Joi.string().required()
});

let field = Joi.object().keys({
	attributedValue: Joi.alternatives(Joi.string().allow(""), Joi.number(), Joi.date().iso()),
	changeMessage: Joi.string().allow("").regex(/%@/),
	dataDetectorType: Joi.array().items(Joi.string().regex(/(PKDataDetectorTypePhoneNumber|PKDataDetectorTypeLink|PKDataDetectorTypeAddress|PKDataDetectorTypeCalendarEvent)/, "dataDetectorType")),
	label: Joi.string().allow(""),
	textAlignment: Joi.string().regex(/(PKTextAlignmentLeft|PKTextAlignmentCenter|PKTextAlignmentRight|PKTextAlignmentNatural)/, "graphic-alignment"),
	key: Joi.string().required(),
	value: Joi.alternatives(Joi.string().allow(""), Joi.number(), Joi.date().iso()).required(),
	// date fields formatters, all optionals
	dateStyle: Joi.string().regex(/(PKDateStyleNone|PKDateStyleShort|PKDateStyleMedium|PKDateStyleLong|PKDateStyleFull)/, "date style"),
	ignoreTimeZone: Joi.boolean(),
	isRelative: Joi.boolean(),
	timeStyle: Joi.string().regex(/(PKDateStyleNone|PKDateStyleShort|PKDateStyleMedium|PKDateStyleLong|PKDateStyleFull)/, "date style"),
	// number fields formatters, all optionals
	currencyCode: Joi.string()
		.when("value", {
			is: Joi.number(),
			otherwise: Joi.string().forbidden()
		}),
	numberStyle: Joi.string()
		.regex(/(PKNumberStyleDecimal|PKNumberStylePercent|PKNumberStyleScientific|PKNumberStyleSpellOut)/)
		.when("value", {
			is: Joi.number(),
			otherwise: Joi.string().forbidden()
		}),
});

let beaconsDict = Joi.object().keys({
	major: Joi.number().integer().positive().max(65535).greater(Joi.ref("minor")),
	minor: Joi.number().integer().positive().max(65535).less(Joi.ref("major")),
	proximityUUID: Joi.string().required(),
	relevantText: Joi.string()
});

let locationsDict = Joi.object().keys({
	altitude: Joi.number(),
	latitude: Joi.number().required(),
	longitude: Joi.number().required(),
	relevantText: Joi.string()
});

let passDict = Joi.object().keys({
	auxiliaryFields: Joi.array().items(field),
	backFields: Joi.array().items(field),
	headerFields: Joi.array().items(field),
	primaryFields: Joi.array().items(field),
	secondaryFields: Joi.array().items(field)
});

let transitType = Joi.string().regex(/(PKTransitTypeAir|PKTransitTypeBoat|PKTransitTypeBus|PKTransitTypeGeneric|PKTransitTypeTrain)/);

let nfcDict = Joi.object().keys({
	message: Joi.string().required().max(64),
	encryptionPublicKey: Joi.string()
});

let schemas = {
	instance,
	barcode,
	field,
	passDict,
	beaconsDict,
	locationsDict,
	transitType,
	nfcDict,
	supportedOptions
};

let resolveSchemaName = (name) => {
	return schemas[name] || "";
};

let isValid = (opts, schemaName) => {
	let resolvedSchema = resolveSchemaName(schemaName);

	if (!resolvedSchema) {
		debug(`validation failed due to missing or mispelled schema name`);
		return false;
	}

	let validation = Joi.validate(opts, resolvedSchema);

	if (validation.error) {
		debug(`validation failed due to error: ${validation.error.message}`);
	}

	return !validation.error;
};

let filter = (opts, schemaName) => {
	let isObject = opts instanceof Object;
	let list = isObject ? Object.keys(opts) : opts;

	return list.reduce((acc, current, index) => {
		let ref = isObject ? current : index;
		let check = isObject ? { [current]: opts[current] } : [opts[index]];

		if (isValid(check, schemaName)) {
			acc[ref] = opts[ref];
		}

		return acc;
	}, isObject ? {} : []);
};

let getValidated = (opts, schemaName) => {
	let resolvedSchema = resolveSchemaName(schemaName);
	let validation = Joi.validate(opts, resolvedSchema);

	if (validation.error) {
		return !validation.error;
	}

	return validation.value;
};

module.exports = {
	isValid,
	filter,
	getValidated
};
