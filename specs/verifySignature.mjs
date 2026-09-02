// @ts-check
/**
 * An independent verifier for the detached PKCS#7 signature a pass carries.
 *
 * It deliberately shares no code with the signing path: the structure is
 * walked with node-forge's ASN.1 parser and the RSA check is done by
 * node:crypto. A bug in the writer therefore cannot be cancelled out by a
 * matching bug here.
 */

import forge from "node-forge";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";

const OID_SIGNED_DATA = "1.2.840.113549.1.7.2";
const OID_DATA = "1.2.840.113549.1.7.1";
const OID_CONTENT_TYPE = "1.2.840.113549.1.9.3";
const OID_MESSAGE_DIGEST = "1.2.840.113549.1.9.4";
const OID_SIGNING_TIME = "1.2.840.113549.1.9.5";

/**
 * @param {Buffer} signature - DER-encoded detached PKCS#7 SignedData
 * @param {Buffer} manifestBuffer - the content the signature covers
 * @param {Buffer|string} signerCertPem - PEM of the certificate expected to have signed
 */
export function verifyDetachedSignature(
	signature,
	manifestBuffer,
	signerCertPem,
) {
	const contentInfo = forge.asn1.fromDer(
		forge.util.createBuffer(signature.toString("binary")),
	);

	const contentType = forge.asn1.derToOid(contentInfo.value[0].value);

	if (contentType !== OID_SIGNED_DATA) {
		throw new Error(`Expected signedData, got OID ${contentType}`);
	}

	const signedData = contentInfo.value[1].value[0];

	const [, digestAlgorithms, encapContentInfo, ...rest] = signedData.value;

	/** Detached: the encapsulated ContentInfo must carry no content */
	if (encapContentInfo.value.length > 1) {
		throw new Error("Signature is not detached: it embeds its content");
	}

	if (forge.asn1.derToOid(encapContentInfo.value[0].value) !== OID_DATA) {
		throw new Error("Encapsulated content type is not `data`");
	}

	const certificates = rest.find(
		(element) =>
			element.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC &&
			element.type === 0,
	);

	if (!certificates) {
		throw new Error("Signature carries no certificates");
	}

	const signerInfos = rest[rest.length - 1];
	const signerInfo = signerInfos.value[0];

	if (!signerInfo) {
		throw new Error("Signature carries no signerInfo");
	}

	const authenticatedAttributes = signerInfo.value.find(
		(element) =>
			element.tagClass === forge.asn1.Class.CONTEXT_SPECIFIC &&
			element.type === 0,
	);

	if (!authenticatedAttributes) {
		throw new Error("signerInfo carries no authenticated attributes");
	}

	const attributesByOid = collectAttributes(authenticatedAttributes);

	for (const [name, oid] of [
		["contentType", OID_CONTENT_TYPE],
		["messageDigest", OID_MESSAGE_DIGEST],
		["signingTime", OID_SIGNING_TIME],
	]) {
		if (!attributesByOid.has(oid)) {
			throw new Error(
				`Missing required authenticated attribute: ${name}`,
			);
		}
	}

	if (
		forge.asn1.derToOid(attributesByOid.get(OID_CONTENT_TYPE).value) !==
		OID_DATA
	) {
		throw new Error("contentType attribute is not `data`");
	}

	/** The messageDigest attribute must equal SHA-1 over the manifest */

	const expectedDigest = crypto
		.createHash("sha1")
		.update(manifestBuffer)
		.digest();
	const declaredDigest = Buffer.from(
		attributesByOid.get(OID_MESSAGE_DIGEST).value,
		"binary",
	);

	if (!expectedDigest.equals(declaredDigest)) {
		throw new Error("messageDigest attribute does not cover this manifest");
	}

	/**
	 * The signature covers the authenticated attributes re-tagged as a
	 * universal SET, not as the implicit [0] they appear as on the wire.
	 */

	const signedAttributesDer = Buffer.from(
		forge.asn1
			.toDer(
				forge.asn1.create(
					forge.asn1.Class.UNIVERSAL,
					forge.asn1.Type.SET,
					true,
					authenticatedAttributes.value,
				),
			)
			.getBytes(),
		"binary",
	);

	const encryptedDigest = Buffer.from(
		signerInfo.value[signerInfo.value.length - 1].value,
		"binary",
	);

	const verified = crypto.verify(
		"sha1",
		signedAttributesDer,
		crypto.createPublicKey(signerCertPem.toString()),
		encryptedDigest,
	);

	if (!verified) {
		throw new Error("RSA verification of the signed attributes failed");
	}

	return {
		certificateCount: certificates.value.length,
		digestAlgorithmCount: digestAlgorithms.value.length,
		signingTime: attributesByOid.get(OID_SIGNING_TIME).value,
	};
}

function collectAttributes(authenticatedAttributes) {
	const map = new Map();

	for (const attribute of authenticatedAttributes.value) {
		const oid = forge.asn1.derToOid(attribute.value[0].value);
		map.set(oid, attribute.value[1].value[0]);
	}

	return map;
}
