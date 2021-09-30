import forge from "node-forge";
import type * as Schemas from "./schemas";

/**
 * Generates the PKCS #7 cryptografic signature for the manifest file.
 *
 * @method create
 * @params manifest - Manifest content.
 * @returns
 */

export function create(
	manifest: { [key: string]: string },
	certificates: Schemas.CertificatesSchema,
): Buffer {
	const signature = forge.pkcs7.createSignedData();

	signature.content = forge.util.createBuffer(
		JSON.stringify(manifest),
		"utf8",
	);

	const { wwdr, signerCert, signerKey, signerKeyPassphrase } = certificates;

	const wwdrString = wwdr instanceof Buffer ? wwdr.toString("utf-8") : wwdr;
	const signerCertString =
		signerCert instanceof Buffer
			? signerCert.toString("utf-8")
			: signerCert;
	const signerKeyString =
		signerKey instanceof Buffer ? signerKey.toString("utf-8") : signerKey;

	signature.addCertificate(wwdrString);
	signature.addCertificate(signerCertString);

	/**
	 * authenticatedAttributes belong to PKCS#9 standard.
	 * It requires at least 2 values:
	 * • content-type (which is a PKCS#7 oid) and
	 * • message-digest oid.
	 *
	 * Wallet requires a signingTime.
	 */

	signature.addSigner({
		key: signerKeyString,
		certificate: signerCertString,
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
