import { Buffer } from "node:buffer";
import Joi from "joi";

export interface CertificatesSchema {
	wwdr: string | Uint8Array;
	signerCert: string | Uint8Array;
	signerKey: string | Uint8Array;
	signerKeyPassphrase?: string;
}

/**
 * Joi.binary is not available in browser-like environments (like Cloudflare workers)
 * so we fallback to manual checking. Buffer must be polyfilled.
 */

export const CertificatesSchema = Joi.object<CertificatesSchema>()
	.keys({
		wwdr: Joi.alternatives(Joi.binary(), Joi.string()).required(),
		signerCert: Joi.alternatives(Joi.binary(), Joi.string()).required(),
		signerKey: Joi.alternatives(Joi.binary(), Joi.string()).required(),
		signerKeyPassphrase: Joi.string(),
	})
	.required();
