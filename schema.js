const Joi = require("joi");

const schema = Joi.object().keys({
	modelDir: Joi.string(),
	modelName: Joi.string(),
	certificates: Joi.object().keys({
		dir: Joi.string(),
		wwdr: Joi.string(),
		signerCert: Joi.string(),
		signerKey: Joi.object().keys({
			keyFile: Joi.string(),
			passphrase: Joi.string(),
		})
	}),
	handlers: Joi.object().keys({
		barcode: Joi.func(),
		serialNumber: Joi.func()
	}),
	overrides: Joi.object()
});

const requiredSchema = schema.requiredKeys(
	"",
	"modelDir",
	"certificates",
	"certificates.dir",
	"certificates.wwdr",
	"certificates.signerCert",
	"certificates.signerKey",
	"certificates.signerKey.keyFile",
	"certificates.signerKey.passphrase"
);

module.exports = {
	validate: (opts) => {
		let validation = Joi.validate(opts, requiredSchema);
		return !validation.error;
	}
};