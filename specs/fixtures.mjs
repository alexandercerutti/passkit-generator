// @ts-check
/**
 * Shared fixtures for the specs.
 *
 * Everything here is ephemeral and generated in-process: no real signing
 * certificate ever touches this repository.
 */

import forge from "node-forge";
import zlib from "node:zlib";
import { Buffer } from "node:buffer";

/**
 * Builds a self-signed CA (stands in for Apple WWDR) and a leaf signer
 * certificate issued by it, mirroring the real trust chain shape.
 *
 * @param {object} [options]
 * @param {string} [options.passphrase] when set, the signer key is emitted as
 * 		an encrypted PKCS#8 blob instead of a plain PKCS#1 one.
 * @param {boolean} [options.bagAttributes] prepend the `Bag Attributes`
 * 		preamble that `openssl pkcs12` writes in front of the PEM block.
 */
export function generateCertificates({
	passphrase = undefined,
	bagAttributes = false,
} = {}) {
	const caKeys = forge.pki.rsa.generateKeyPair(2048);
	const wwdr = forge.pki.createCertificate();

	wwdr.publicKey = caKeys.publicKey;
	wwdr.serialNumber = "01";
	wwdr.validity.notBefore = new Date(2020, 0, 1);
	wwdr.validity.notAfter = new Date(2040, 0, 1);

	const caAttrs = [
		{ name: "commonName", value: "Test WWDR CA" },
		{ name: "organizationName", value: "passkit-generator specs" },
	];

	wwdr.setSubject(caAttrs);
	wwdr.setIssuer(caAttrs);
	wwdr.setExtensions([{ name: "basicConstraints", cA: true }]);
	wwdr.sign(caKeys.privateKey, forge.md.sha256.create());

	const signerKeys = forge.pki.rsa.generateKeyPair(2048);
	const signerCert = forge.pki.createCertificate();

	signerCert.publicKey = signerKeys.publicKey;
	signerCert.serialNumber = "02";
	signerCert.validity.notBefore = new Date(2020, 0, 1);
	signerCert.validity.notAfter = new Date(2040, 0, 1);

	signerCert.setSubject([
		{ name: "commonName", value: "Pass Type ID: pass.com.example.test" },
		{ name: "organizationName", value: "passkit-generator specs" },
	]);
	signerCert.setIssuer(caAttrs);
	signerCert.sign(caKeys.privateKey, forge.md.sha256.create());

	let signerKeyPem;

	if (passphrase) {
		signerKeyPem = forge.pki.encryptedPrivateKeyToPem(
			forge.pki.encryptPrivateKeyInfo(
				forge.pki.wrapRsaPrivateKey(
					forge.pki.privateKeyToAsn1(signerKeys.privateKey),
				),
				passphrase,
				{ algorithm: "aes256" },
			),
		);
	} else {
		signerKeyPem = forge.pki.privateKeyToPem(signerKeys.privateKey);
	}

	if (bagAttributes) {
		signerKeyPem =
			[
				"Bag Attributes",
				"    localKeyID: A1 B2 C3 D4 E5 F6 07 18 29 3A 4B 5C 6D 7E 8F 90",
				"    friendlyName: Pass Type ID: pass.com.example.test",
				"Key Attributes: <No Attributes>",
			].join("\n") +
			"\n" +
			signerKeyPem;
	}

	return {
		wwdr: Buffer.from(forge.pki.certificateToPem(wwdr)),
		signerCert: Buffer.from(forge.pki.certificateToPem(signerCert)),
		signerKey: Buffer.from(signerKeyPem),
		...(passphrase ? { signerKeyPassphrase: passphrase } : {}),
	};
}

/**
 * Emits a structurally valid PNG of the requested pixel size. Content is
 * deterministic, so digests over these assets are stable across runs.
 *
 * @param {number} width
 * @param {number} height
 * @param {number} seed
 */
export function createPng(width, height, seed = 0) {
	const raw = Buffer.alloc(height * (1 + width * 4));

	for (let y = 0; y < height; y++) {
		const rowStart = y * (1 + width * 4);
		raw[rowStart] = 0; // filter type: none

		for (let x = 0; x < width; x++) {
			const p = rowStart + 1 + x * 4;
			/**
			 * Smooth, banded gradients: real pass artwork is mostly flat
			 * colour and compresses well, so high-entropy noise here would
			 * inflate the fixture far past a realistic bundle size.
			 */
			raw[p] = ((x >> 2) + (y >> 3) + seed) & 0xff;
			raw[p + 1] = ((x >> 3) + (y >> 2) * 2 + seed * 3) & 0xff;
			raw[p + 2] = ((x * 3 + y) >> 3) & 0xff;
			raw[p + 3] = 0xff;
		}
	}

	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 6; // colour type: RGBA
	ihdr[10] = 0;
	ihdr[11] = 0;
	ihdr[12] = 0;

	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		pngChunk("IHDR", ihdr),
		pngChunk("IDAT", zlib.deflateSync(raw, { level: 6 })),
		pngChunk("IEND", Buffer.alloc(0)),
	]);
}

function pngChunk(type, data) {
	const out = Buffer.alloc(12 + data.length);
	out.writeUInt32BE(data.length, 0);
	out.write(type, 4, "ascii");
	data.copy(out, 8);
	out.writeUInt32BE(
		crc32(out.subarray(4, 8 + data.length)) >>> 0,
		8 + data.length,
	);
	return out;
}

const CRC_TABLE = (() => {
	const table = new Int32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[n] = c;
	}
	return table;
})();

function crc32(buffer) {
	let sum = -1;
	for (let i = 0; i < buffer.length; i++) {
		sum = (sum >>> 8) ^ CRC_TABLE[(sum ^ buffer[i]) & 0xff];
	}
	return sum ^ -1;
}

/**
 * A realistic 10-file asset bundle weighing roughly 450KB, the shape of a
 * real pass: three icon sizes, three logo sizes, three strip sizes and a
 * thumbnail.
 */
export function createAssets() {
	/** @type {[string, number, number][]} */
	const spec = [
		["icon.png", 29, 29],
		["icon@2x.png", 58, 58],
		["icon@3x.png", 87, 87],
		["logo.png", 160, 50],
		["logo@2x.png", 320, 100],
		["logo@3x.png", 480, 150],
		["strip.png", 375, 123],
		["strip@2x.png", 750, 246],
		["strip@3x.png", 1125, 369],
		["thumbnail.png", 90, 90],
	];

	/** @type {{[fileName: string]: Buffer}} */
	const assets = {};

	spec.forEach(([name, w, h], index) => {
		assets[name] = createPng(w, h, index);
	});

	return assets;
}

export const PASS_PROPS = Object.freeze({
	formatVersion: 1,
	passTypeIdentifier: "pass.com.example.test",
	teamIdentifier: "ABCDE12345",
	organizationName: "passkit-generator specs",
	description: "Test pass",
	serialNumber: "test-0001",
	foregroundColor: "rgb(255, 255, 255)",
	backgroundColor: "rgb(0, 122, 255)",
	labelColor: "rgb(255, 255, 255)",
});
