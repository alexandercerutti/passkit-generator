import type forge from "node-forge";
import Joi from "joi";

export interface CertificatesSchema {
	wwdr: string | Buffer;
	signerCert: string | Buffer;
	signerKey: string | Buffer;
	signerKeyPassphrase?: string;
}

// Joi.binary is not available in the browser so fallback to basic check
const binary = Joi.binary ? Joi.binary() : Joi.custom((obj) => Buffer.isBuffer(obj));

export const CertificatesSchema = Joi.object<CertificatesSchema>()
	.keys({
		wwdr: Joi.alternatives(binary, Joi.string()).required(),
		signerCert: Joi.alternatives(binary, Joi.string()).required(),
		signerKey: Joi.alternatives(binary, Joi.string()).required(),
		signerKeyPassphrase: Joi.string(),
	})
	.required();
