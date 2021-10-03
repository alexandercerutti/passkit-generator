import type forge from "node-forge";
import Joi from "joi";

export interface CertificatesSchema {
	wwdr: string | Buffer;
	signerCert: string | Buffer;
	signerKey: string | Buffer;
	signerKeyPassphrase?: string;
}

export const CertificatesSchema = Joi.object<CertificatesSchema>()
	.keys({
		wwdr: Joi.alternatives(Joi.binary(), Joi.string()).required(),
		signerCert: Joi.alternatives(Joi.binary(), Joi.string()).required(),
		signerKey: Joi.alternatives(Joi.binary(), Joi.string()).required(),
		signerKeyPassphrase: Joi.string(),
	})
	.required();
