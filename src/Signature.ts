import * as asn1js from "asn1js";
import {
	createHash as createNativeHash,
	createPrivateKey,
	sign as signWithKey,
	type KeyObject,
} from "node:crypto";
import type * as Schemas from "./schemas/index.js";
import { Buffer } from "node:buffer";

/**
 * Creates an hash for a buffer. Used by manifest
 *
 * Node's SHA-1 hashes the buffer directly, where the previous pure-JS
 * implementation had to first widen every byte into a latin1 string. Both
 * produce the same digest — latin1 is a lossless byte-to-character mapping —
 * but hashing a manifest's worth of image data natively is around twenty
 * times cheaper.
 *
 * @param buffer
 * @returns
 */

export function createHash(buffer: Buffer) {
	return createNativeHash("sha1").update(buffer).digest("hex");
}

const OID = {
	signedData: "1.2.840.113549.1.7.2",
	data: "1.2.840.113549.1.7.1",
	sha1: "1.3.14.3.2.26",
	rsaEncryption: "1.2.840.113549.1.1.1",
	contentType: "1.2.840.113549.1.9.3",
	messageDigest: "1.2.840.113549.1.9.4",
	signingTime: "1.2.840.113549.1.9.5",
} as const;

const CONTEXT_SPECIFIC = 3;

/**
 * Decrypting a PEM private key runs the key derivation function that protects
 * it, and a service issuing passes uses the very same key every time, so the
 * parsed key is memoized instead of being derived over and over again.
 *
 * The cache is bounded because a multi-tenant issuer may legitimately rotate
 * between several keys, and it is keyed by a digest rather than by the key
 * material itself so that neither the PEM nor the passphrase is retained in a
 * long-lived structure.
 */

const SIGNER_KEY_CACHE_LIMIT = 32;

const signerKeyCache = new Map<string, KeyObject>();

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

function getSignerKey(
	signerKey: string,
	passphrase: string | undefined,
): KeyObject {
	const cacheKey = getSignerKeyCacheKey(signerKey, passphrase ?? "");
	const cached = signerKeyCache.get(cacheKey);

	if (cached) {
		/** Re-inserting refreshes recency, so the map evicts least-recently-used */
		signerKeyCache.delete(cacheKey);
		signerKeyCache.set(cacheKey, cached);

		return cached;
	}

	/**
	 * Node accepts PKCS#1, PKCS#8 and encrypted forms of both, and tolerates
	 * the `Bag Attributes` preamble `openssl pkcs12` writes ahead of the PEM
	 * block. A wrong or missing passphrase throws here rather than failing
	 * later with an unusable key.
	 */

	const parsedKey = passphrase
		? createPrivateKey({ key: signerKey, passphrase })
		: createPrivateKey(signerKey);

	if (signerKeyCache.size >= SIGNER_KEY_CACHE_LIMIT) {
		signerKeyCache.delete(signerKeyCache.keys().next().value as string);
	}

	signerKeyCache.set(cacheKey, parsedKey);

	return parsedKey;
}

/**
 * Generates the PKCS #7 cryptografic signature for the manifest file.
 *
 * The structure is assembled with asn1js and signed with node:crypto, both of
 * which are synchronous, so this keeps returning a Buffer rather than a
 * Promise. A pure-JS RSA implementation was previously responsible for most of
 * the cost of issuing a pass.
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
	const wwdr = parseCertificate(bufferToString(certificates.wwdr));
	const signerCert = parseCertificate(
		bufferToString(certificates.signerCert),
	);

	const signerKey = getSignerKey(
		bufferToString(certificates.signerKey),
		certificates.signerKeyPassphrase,
	);

	/**
	 * authenticatedAttributes belong to PKCS#9 standard.
	 * It requires at least 2 values:
	 * • content-type (which is a PKCS#7 oid) and
	 * • message-digest oid.
	 *
	 * Wallet requires a signingTime.
	 *
	 * They are emitted in this order rather than sorted by their encoding:
	 * verifiers re-encode the attributes exactly as they were parsed, and this
	 * is the order every pass issued by this library has carried so far.
	 */

	const authenticatedAttributes = [
		createAttribute(
			OID.contentType,
			new asn1js.ObjectIdentifier({ value: OID.data }),
		),
		createAttribute(
			OID.messageDigest,
			new asn1js.OctetString({
				valueHex: toArrayBuffer(
					createNativeHash("sha1").update(manifestBuffer).digest(),
				),
			}),
		),
		createAttribute(
			OID.signingTime,
			new asn1js.UTCTime({ valueDate: new Date() }),
		),
	];

	/**
	 * The signature covers the attributes encoded as a plain SET, even though
	 * they travel inside the signer info under an implicit [0] tag.
	 */

	const signedAttributes = Buffer.from(
		new asn1js.Set({ value: authenticatedAttributes }).toBER(false),
	);

	const signature = signWithKey("sha1", signedAttributes, signerKey);

	const signerInfo = new asn1js.Sequence({
		value: [
			new asn1js.Integer({ value: 1 }),
			new asn1js.Sequence({
				value: [signerCert.issuer, signerCert.serialNumber],
			}),
			createAlgorithmIdentifier(OID.sha1),
			new asn1js.Constructed({
				idBlock: { tagClass: CONTEXT_SPECIFIC, tagNumber: 0 },
				value: authenticatedAttributes,
			}),
			createAlgorithmIdentifier(OID.rsaEncryption),
			new asn1js.OctetString({ valueHex: toArrayBuffer(signature) }),
		],
	});

	/**
	 * We are creating a detached signature because we don't need the signed
	 * content: the encapsulated ContentInfo carries its type and nothing else.
	 * Detached signature is a property of PKCS#7 cryptography standard.
	 */

	const signedData = new asn1js.Sequence({
		value: [
			new asn1js.Integer({ value: 1 }),
			new asn1js.Set({ value: [createAlgorithmIdentifier(OID.sha1)] }),
			new asn1js.Sequence({
				value: [new asn1js.ObjectIdentifier({ value: OID.data })],
			}),
			new asn1js.Constructed({
				idBlock: { tagClass: CONTEXT_SPECIFIC, tagNumber: 0 },
				value: [wwdr.certificate, signerCert.certificate],
			}),
			new asn1js.Set({ value: [signerInfo] }),
		],
	});

	const contentInfo = new asn1js.Sequence({
		value: [
			new asn1js.ObjectIdentifier({ value: OID.signedData }),
			new asn1js.Constructed({
				idBlock: { tagClass: CONTEXT_SPECIFIC, tagNumber: 0 },
				value: [signedData],
			}),
		],
	});

	return Buffer.from(contentInfo.toBER(false));
}

function createAlgorithmIdentifier(oid: string): asn1js.Sequence {
	return new asn1js.Sequence({
		value: [new asn1js.ObjectIdentifier({ value: oid }), new asn1js.Null()],
	});
}

function createAttribute(oid: string, value: asn1js.AsnType): asn1js.Sequence {
	return new asn1js.Sequence({
		value: [
			new asn1js.ObjectIdentifier({ value: oid }),
			new asn1js.Set({ value: [value] }),
		],
	});
}

interface ParsedCertificate {
	certificate: asn1js.AsnType;
	issuer: asn1js.AsnType;
	serialNumber: asn1js.AsnType;
}

const PEM_CERTIFICATE =
	/-----BEGIN CERTIFICATE-----([A-Za-z0-9+/=\s]+?)-----END CERTIFICATE-----/;

/**
 * Reads a PEM certificate and picks out the two fields the signer info has to
 * name: the issuer and the serial number. Anything ahead of the PEM block —
 * such as the `Bag Attributes` preamble — is ignored, and when a file holds a
 * chain only the first certificate is used.
 */

function parseCertificate(pem: string): ParsedCertificate {
	const match = PEM_CERTIFICATE.exec(pem);

	if (!match) {
		throw new Error(
			"Invalid certificate: no PEM certificate block was found.",
		);
	}

	const der = Buffer.from(match[1].replace(/\s+/g, ""), "base64");
	const { result, offset } = asn1js.fromBER(toArrayBuffer(der));

	if (offset === -1) {
		throw new Error("Invalid certificate: could not be parsed as DER.");
	}

	const tbsCertificate = (result as asn1js.Sequence).valueBlock
		.value[0] as asn1js.Sequence;
	const fields = tbsCertificate.valueBlock.value;

	/**
	 * `version` is an optional [0] EXPLICIT field. When it is absent the
	 * certificate is v1 and `serialNumber` comes first instead.
	 */

	const hasVersion =
		fields[0].idBlock.tagClass === CONTEXT_SPECIFIC &&
		fields[0].idBlock.tagNumber === 0;
	const serialNumberIndex = hasVersion ? 1 : 0;

	/** TBSCertificate ::= { [version,] serialNumber, signature, issuer, ... } */

	return {
		certificate: result,
		serialNumber: fields[serialNumberIndex],
		issuer: fields[serialNumberIndex + 2],
	};
}

function bufferToString(source: string | Buffer): string {
	return Buffer.isBuffer(source) ? source.toString("utf-8") : source;
}

/**
 * asn1js works on ArrayBuffers. A Buffer is frequently a window onto a larger
 * shared pool, so the region it actually owns has to be copied out.
 */

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
	return buffer.buffer.slice(
		buffer.byteOffset,
		buffer.byteOffset + buffer.byteLength,
	) as ArrayBuffer;
}
