import type forge from "node-forge";
import Joi from "joi";

export interface CertificatesSchema {
	wwdr: string | Buffer;
	signerCert: string | Buffer;
	signerKey: string | Buffer;
	signerKeyPassphrase?: string;
}

// Joi.binary is not available in the browser
const maybeBinaryOrString = Joi.binary ? [Joi.binary(), Joi.string()] : [Joi.string()];

export const CertificatesSchema = Joi.object<CertificatesSchema>()
	.keys({
		wwdr: Joi.alternatives(...maybeBinaryOrString).required(),
		signerCert: Joi.alternatives(...maybeBinaryOrString).required(),
		signerKey: Joi.alternatives(...maybeBinaryOrString).required(),
		signerKeyPassphrase: Joi.string(),
	})
	.required();
