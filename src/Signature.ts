import forge from "node-forge";
import { createHash as createNativeHash } from "node:crypto";
import type * as Schemas from "./schemas/index.js";
import { Buffer } from "node:buffer";

/**
 * Creates an hash for a buffer. Used by manifest
 *
 * @param buffer
 * @returns
 */

export function createHash(buffer: Buffer) {
	const hashFlow = forge.md.sha1.create();
	hashFlow.update(buffer.toString("binary"));

	return hashFlow.digest().toHex();
}

/**
 * Decrypting a PEM private key runs the key derivation function that protects
 * it, which is by far the most expensive part of parsing the certificates.
 * A service issuing passes reuses the very same signing key for every pass, so
 * the parsed key is memoized instead of being derived over and over again.
 *
 * The cache is bounded because a multi-tenant issuer may legitimately rotate
 * between several keys, and it is keyed by a digest rather than by the key
 * material itself so that neither the PEM nor the passphrase is retained in a
 * long-lived structure.
 */

const SIGNER_KEY_CACHE_LIMIT = 32;

const signerKeyCache = new Map<string, forge.pki.rsa.PrivateKey>();

function getSignerKeyCacheKey(signerKey: string, passphrase: string): string {
	/**
	 * Both fields are length-prefixed so that no two different
	 * (key, passphrase) pairs can produce the same digest input.
	 */

	return createNativeHash("sha256")
		.update(
			`${signerKey.length}:${signerKey}:${passphrase.length}:${passphrase}`,
		)
		.digest("base64");
}

function getCachedSignerKey(
	signerKey: string,
	passphrase: string | undefined,
): forge.pki.rsa.PrivateKey {
	const cacheKey = getSignerKeyCacheKey(signerKey, passphrase ?? "");
	const cached = signerKeyCache.get(cacheKey);

	if (cached) {
		/** Re-inserting refreshes recency, so the map evicts least-recently-used */
		signerKeyCache.delete(cacheKey);
		signerKeyCache.set(cacheKey, cached);

		return cached;
	}

	const parsedKey = forge.pki.decryptRsaPrivateKey(signerKey, passphrase);

	if (signerKeyCache.size >= SIGNER_KEY_CACHE_LIMIT) {
		signerKeyCache.delete(signerKeyCache.keys().next().value as string);
	}

	signerKeyCache.set(cacheKey, parsedKey);

	return parsedKey;
}

/**
 * Generates the PKCS #7 cryptografic signature for the manifest file.
 *
 * @method create
 * @params manifest
 * @params certificates
 * @returns
 */

export function create(
	manifestBuffer: Buffer,
	certificates: Schemas.CertificatesSchema,
): Buffer {
	const signature = forge.pkcs7.createSignedData();

	signature.content = new forge.util.ByteStringBuffer(manifestBuffer);

	const { wwdr, signerCert, signerKey } = parseCertificates(
		getStringCertificates(certificates),
	);

	signature.addCertificate(wwdr);
	signature.addCertificate(signerCert);

	/**
	 * authenticatedAttributes belong to PKCS#9 standard.
	 * It requires at least 2 values:
	 * • content-type (which is a PKCS#7 oid) and
	 * • message-digest oid.
	 *
	 * Wallet requires a signingTime.
	 */

	signature.addSigner({
		key: signerKey,
		certificate: signerCert,
		digestAlgorithm: forge.pki.oids.sha1,
		authenticatedAttributes: [
			{
				type: forge.pki.oids.contentType,
				value: forge.pki.oids.data,
			},
			{
				type: forge.pki.oids.messageDigest,
			},
			{
				type: forge.pki.oids.signingTime,
			},
		],
	});

	/**
	 * We are creating a detached signature because we don't need the signed content.
	 * Detached signature is a property of PKCS#7 cryptography standard.
	 */

	signature.sign({ detached: true });

	/**
	 * Signature here is an ASN.1 valid structure (DER-compliant).
	 * Generating a non-detached signature, would have pushed inside signature.contentInfo
	 * (which has type 16, or "SEQUENCE", and is an array) a Context-Specific element, with the
	 * signed content as value.
	 *
	 * In fact the previous approach was to generating a detached signature and the pull away the generated
	 * content.
	 *
	 * That's what happens when you copy a fu****g line without understanding what it does.
	 * Well, nevermind, it was funny to study BER, DER, CER, ASN.1 and PKCS#7. You can learn a lot
	 * of beautiful things. ¯\_(ツ)_/¯
	 */

	return Buffer.from(
		forge.asn1.toDer(signature.toAsn1()).getBytes(),
		"binary",
	);
}

/**
 * Parses the PEM-formatted passed text (certificates)
 *
 * @param element - Text content of .pem files
 * @param passphrase - passphrase for the key
 * @returns The parsed certificate or key in node forge format
 */

function parseCertificates(certificates: Schemas.CertificatesSchema) {
	const { signerCert, signerKey, wwdr, signerKeyPassphrase } = certificates;

	return {
		signerCert: forge.pki.certificateFromPem(signerCert.toString("utf-8")),
		wwdr: forge.pki.certificateFromPem(wwdr.toString("utf-8")),
		signerKey: getCachedSignerKey(
			signerKey.toString("utf-8"),
			signerKeyPassphrase,
		),
	};
}

function getStringCertificates(
	certificates: Schemas.CertificatesSchema,
): Record<
	keyof Omit<Schemas.CertificatesSchema, "signerKeyPassphrase">,
	string
> & { signerKeyPassphrase?: string } {
	return {
		signerKeyPassphrase: certificates.signerKeyPassphrase,
		wwdr: Buffer.from(certificates.wwdr).toString("utf-8"),
		signerCert: Buffer.from(certificates.signerCert).toString("utf-8"),
		signerKey: Buffer.from(certificates.signerKey).toString("utf-8"),
	};
}
