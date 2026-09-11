// @ts-check
/**
 * Correctness bar for the signing path.
 *
 * A pass signature is checked by real devices, so every assertion here is made
 * against something other than the code that produced it: an independent
 * ASN.1 walk plus node:crypto, and — where the binary exists — openssl itself.
 */

import { expect, it, describe, beforeAll } from "@jest/globals";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Buffer } from "node:buffer";
import { PKPass } from "passkit-generator";
import { readZipEntries } from "./zipReader.mjs";
import { verifyDetachedSignature } from "./verifySignature.mjs";
import { generateCertificates, createAssets, PASS_PROPS } from "./fixtures.mjs";

const assets = createAssets();

/**
 * Passphrases are generated per run rather than written into the file.
 * Nothing in the signing path depends on a particular value, and a string
 * literal that looks like a password trips secret scanners for no reason.
 */
function testPassphrase() {
	return randomBytes(16).toString("hex");
}

const hasOpenssl = (() => {
	try {
		execFileSync("openssl", ["version"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
})();

/**
 * @param {import("passkit-generator").PassProps extends never ? never : any} certificates
 */
function buildPass(certificates, overrides = {}) {
	const pass = new PKPass({}, certificates, { ...PASS_PROPS, ...overrides });

	for (const [fileName, buffer] of Object.entries(assets)) {
		pass.addBuffer(fileName, buffer);
	}

	pass.type = "storeCard";

	return readZipEntries(pass.getAsBuffer());
}

/**
 * Runs `openssl smime -verify` over a detached signature, returning stderr
 * on failure instead of throwing, so both outcomes can be asserted.
 */
function opensslVerify(signature, content, { caFile } = {}) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pkpass-verify-"));

	try {
		const signaturePath = path.join(dir, "signature");
		const contentPath = path.join(dir, "content");

		fs.writeFileSync(signaturePath, signature);
		fs.writeFileSync(contentPath, content);

		const args = [
			"smime",
			"-verify",
			"-inform",
			"DER",
			"-in",
			signaturePath,
			"-content",
			contentPath,
		];

		if (caFile) {
			const caPath = path.join(dir, "ca.pem");
			fs.writeFileSync(caPath, caFile);
			args.push("-CAfile", caPath, "-purpose", "any");
		} else {
			args.push("-noverify");
		}

		try {
			execFileSync("openssl", args, { stdio: "pipe" });
			return { ok: true, stderr: "" };
		} catch (error) {
			return { ok: false, stderr: String(error.stderr ?? error) };
		}
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

describe("Signature", () => {
	describe("with an unencrypted PKCS#1 signer key", () => {
		const certificates = generateCertificates();
		/** @type {{[k: string]: Buffer}} */
		let files;

		beforeAll(() => {
			files = buildPass(certificates);
		});

		it("produces a signature an independent verifier accepts", () => {
			const result = verifyDetachedSignature(
				files["signature"],
				files["manifest.json"],
				certificates.signerCert,
			);

			expect(result.certificateCount).toBe(2);
			expect(result.digestAlgorithmCount).toBe(1);
			expect(result.signingTime).toBeTruthy();
		});

		it("rejects a tampered manifest", () => {
			expect(() =>
				verifyDetachedSignature(
					files["signature"],
					Buffer.from(
						'{"icon.png":"0000000000000000000000000000000000000000"}',
					),
					certificates.signerCert,
				),
			).toThrow(/messageDigest/);
		});

		it("does not verify against an unrelated certificate", () => {
			const stranger = generateCertificates();

			expect(() =>
				verifyDetachedSignature(
					files["signature"],
					files["manifest.json"],
					stranger.signerCert,
				),
			).toThrow(/RSA verification/);
		});

		(hasOpenssl ? it : it.skip)("verifies under openssl smime", () => {
			expect(
				opensslVerify(files["signature"], files["manifest.json"]),
			).toMatchObject({ ok: true });
		});

		(hasOpenssl ? it : it.skip)(
			"verifies its certificate chain up to the WWDR certificate",
			() => {
				expect(
					opensslVerify(files["signature"], files["manifest.json"], {
						caFile: certificates.wwdr,
					}),
				).toMatchObject({ ok: true });
			},
		);

		(hasOpenssl ? it : it.skip)(
			"is rejected by openssl when the manifest is tampered with",
			() => {
				expect(
					opensslVerify(files["signature"], Buffer.from("tampered")),
				).toMatchObject({ ok: false });
			},
		);
	});

	describe("with an encrypted PKCS#8 signer key", () => {
		it("accepts a passphrase-protected key carrying a Bag Attributes preamble", () => {
			const certificates = generateCertificates({
				passphrase: testPassphrase(),
				bagAttributes: true,
			});

			expect(certificates.signerKey.toString("utf-8")).toMatch(
				/^Bag Attributes/,
			);

			const files = buildPass(certificates);

			expect(() =>
				verifyDetachedSignature(
					files["signature"],
					files["manifest.json"],
					certificates.signerCert,
				),
			).not.toThrow();
		});

		it("fails loudly when the passphrase is wrong", () => {
			const correct = testPassphrase();
			const certificates = generateCertificates({
				passphrase: correct,
				bagAttributes: true,
			});

			expect(() =>
				buildPass({
					...certificates,
					signerKeyPassphrase: `${correct}-not-it`,
				}),
			).toThrow();
		});

		it("fails loudly when the passphrase is missing entirely", () => {
			const certificates = generateCertificates({
				passphrase: testPassphrase(),
			});

			expect(() =>
				buildPass({ ...certificates, signerKeyPassphrase: undefined }),
			).toThrow();
		});
	});

	describe("signer key caching", () => {
		it("signs correctly across repeated passes with the same key", () => {
			const certificates = generateCertificates({
				passphrase: testPassphrase(),
			});

			for (let i = 0; i < 3; i++) {
				const files = buildPass(certificates, {
					serialNumber: `repeat-${i}`,
				});

				expect(() =>
					verifyDetachedSignature(
						files["signature"],
						files["manifest.json"],
						certificates.signerCert,
					),
				).not.toThrow();
			}
		});

		it("keeps distinct keys apart when they are interleaved", () => {
			const first = generateCertificates({
				passphrase: testPassphrase(),
			});
			const second = generateCertificates({
				passphrase: testPassphrase(),
			});

			for (const [a, b] of [
				[first, second],
				[second, first],
			]) {
				const filesA = buildPass(a);
				const filesB = buildPass(b);

				/** Each signature must verify against its own certificate... */
				expect(() =>
					verifyDetachedSignature(
						filesA["signature"],
						filesA["manifest.json"],
						a.signerCert,
					),
				).not.toThrow();

				/** ...and must not verify against the other's */
				expect(() =>
					verifyDetachedSignature(
						filesA["signature"],
						filesA["manifest.json"],
						b.signerCert,
					),
				).toThrow(/RSA verification/);

				expect(() =>
					verifyDetachedSignature(
						filesB["signature"],
						filesB["manifest.json"],
						b.signerCert,
					),
				).not.toThrow();
			}
		});

		it("does not let the same key with a different passphrase collide", () => {
			const correct = testPassphrase();
			const certificates = generateCertificates({ passphrase: correct });

			expect(() => buildPass(certificates)).not.toThrow();
			expect(() =>
				buildPass({
					...certificates,
					signerKeyPassphrase: `${correct}-not-it`,
				}),
			).toThrow();
			expect(() => buildPass(certificates)).not.toThrow();
		});
	});
});
