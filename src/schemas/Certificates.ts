import { z } from "zod";
import { Buffer } from "node:buffer";

export type CertificatesSchema = z.infer<typeof CertificatesSchema>;

/**
 * Joi.binary is not available in browser-like environments (like Cloudflare workers)
 * so we fallback to manual checking. Buffer must be polyfilled.
 *
 * @TODO Check if zod has similar issues in such environments.
 */

// const binary = Joi.binary
// 	? Joi.binary()
// 	: Joi.custom((obj) => Buffer.isBuffer(obj));

export const CertificatesSchema = z.object({
	wwdr: z.union([z.instanceof(Buffer), z.string()]),
	signerCert: z.union([z.instanceof(Buffer), z.string()]),
	signerKey: z.union([z.instanceof(Buffer), z.string()]),
	signerKeyPassphrase: z.string().optional(),
});
