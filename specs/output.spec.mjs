// @ts-check
/**
 * Pins the shape of what a pass export actually produces.
 *
 * The digests and file ordering below were captured from an unmodified
 * passkit-generator@3.5.7 running these same fixtures, before any of the
 * performance work landed. Hashing, archiving and signing were all rewritten
 * afterwards; none of that was allowed to change a byte of the output, and
 * these constants are what holds that line.
 *
 * The manifest is a SHA-1 of every other file, so pinning it pins the exact
 * bytes of pass.json and of each pass.strings too, not merely their presence.
 */

import { expect, it, describe, beforeAll } from "@jest/globals";
import { Buffer } from "node:buffer";
import { Stream } from "node:stream";
import { PKPass } from "passkit-generator";
import { readZip, readZipEntries } from "./zipReader.mjs";
import { generateCertificates, createAssets, PASS_PROPS } from "./fixtures.mjs";

/** Captured from passkit-generator@3.5.7 */
const EXPECTED_FILE_ORDER = [
	"icon.png",
	"icon@2x.png",
	"icon@3x.png",
	"logo.png",
	"logo@2x.png",
	"logo@3x.png",
	"strip.png",
	"strip@2x.png",
	"strip@3x.png",
	"thumbnail.png",
	"pass.json",
	"it.lproj/pass.strings",
	"en.lproj/pass.strings",
	"manifest.json",
	"signature",
];

/** Captured from passkit-generator@3.5.7 */
const EXPECTED_MANIFEST = {
	"icon.png": "e6d6b9ca14a27205ff706e29b0bf0693e735b861",
	"icon@2x.png": "a4bd920cec90bd531e8f80f3e021f292ad3055a6",
	"icon@3x.png": "69741b3e0e40533a76661fb644c0b6cb0b0b0934",
	"logo.png": "629ae1a98d44c82b6651fb40b6298eff92858f5f",
	"logo@2x.png": "dc377bedf65f2562ee0e3e1609880bf6472738b6",
	"logo@3x.png": "a3fc394a385847650ba4bd8967be68292f83a688",
	"strip.png": "07af98c463dff36a0aaffcd98bcfdcf46610ee13",
	"strip@2x.png": "94b844b1284aaa82bd8d222eb833d1d300756968",
	"strip@3x.png": "63fdfebbc434b425c9b070cb83a2539f4c090c30",
	"thumbnail.png": "4c35485eaadbd5c96b08b02b05520d76dc5a5293",
	"pass.json": "1262a57bf104dcdf6c5e94a12c47ad8316029eea",
	"it.lproj/pass.strings": "a91fcfdc5aaf62168ae494989e302449272280bd",
	"en.lproj/pass.strings": "e1e68d3120734ad269da0c6a371551a99cc23632",
};

const certificates = generateCertificates();
const assets = createAssets();

function buildPass() {
	const pass = new PKPass({}, certificates, { ...PASS_PROPS });

	for (const [fileName, buffer] of Object.entries(assets)) {
		pass.addBuffer(fileName, buffer);
	}

	pass.type = "storeCard";
	pass.primaryFields.push({
		key: "balance",
		label: "BALANCE",
		value: "$42.00",
	});
	pass.secondaryFields.push({
		key: "member",
		label: "MEMBER",
		value: "Jane Doe",
	});

	pass.localize("en", { BALANCE: "Balance", MEMBER: "Member" });
	pass.localize("it", { BALANCE: "Saldo", MEMBER: "Membro" });

	return pass;
}

describe("pass output", () => {
	/** @type {Buffer} */
	let bundle;
	/** @type {{[k: string]: Buffer}} */
	let files;

	beforeAll(() => {
		bundle = buildPass().getAsBuffer();
		files = readZipEntries(bundle);
	});

	it("contains the same files, in the same order, as 3.5.7 produced", () => {
		expect(readZip(bundle).entries.map((entry) => entry.name)).toEqual(
			EXPECTED_FILE_ORDER,
		);
	});

	it("hashes every asset to the digest 3.5.7 recorded", () => {
		expect(JSON.parse(files["manifest.json"].toString("utf-8"))).toEqual(
			EXPECTED_MANIFEST,
		);
	});

	it("writes the manifest with its keys in insertion order", () => {
		/**
		 * The manifest is hashed and signed as raw bytes, so key order is part
		 * of the output, not an implementation detail.
		 */
		expect(
			Object.keys(JSON.parse(files["manifest.json"].toString("utf-8"))),
		).toEqual(Object.keys(EXPECTED_MANIFEST));
	});

	it("excludes the manifest and the signature from the manifest", () => {
		const manifest = JSON.parse(files["manifest.json"].toString("utf-8"));

		expect(manifest["manifest.json"]).toBeUndefined();
		expect(manifest["signature"]).toBeUndefined();
	});

	it("keeps pass.json keys in the documented order", () => {
		const passJson = JSON.parse(files["pass.json"].toString("utf-8"));

		expect(Object.keys(passJson)).toEqual([
			"formatVersion",
			"passTypeIdentifier",
			"teamIdentifier",
			"organizationName",
			"description",
			"serialNumber",
			"foregroundColor",
			"backgroundColor",
			"labelColor",
			"storeCard",
		]);
	});

	it("writes pass.strings for every localization", () => {
		expect(files["en.lproj/pass.strings"].toString("utf-8")).toBe(
			'"BALANCE" = "Balance";\n"MEMBER" = "Member";',
		);
		expect(files["it.lproj/pass.strings"].toString("utf-8")).toBe(
			'"BALANCE" = "Saldo";\n"MEMBER" = "Membro";',
		);
	});

	it("emits a signature", () => {
		expect(files["signature"].length).toBeGreaterThan(0);
	});
});

describe("export methods", () => {
	it("returns a Buffer synchronously, not a Promise", () => {
		/**
		 * The signing path is deliberately synchronous. Returning a Promise
		 * here would break every existing caller, so it is asserted rather
		 * than assumed.
		 */

		const result = buildPass().getAsBuffer();

		expect(result).toBeInstanceOf(Buffer);
		expect(result).not.toBeInstanceOf(Promise);
		expect(/** @type {any} */ (result).then).toBeUndefined();
	});

	it("streams exactly what the buffer export contains", async () => {
		/**
		 * Both exports have to come from the same pass: a second one would be
		 * signed a moment later and carry different signature bytes.
		 */

		const pass = buildPass();
		const stream = pass.getAsStream();

		expect(stream).toBeInstanceOf(Stream);

		const chunks = [];

		for await (const chunk of stream) {
			chunks.push(chunk);
		}

		expect(chunks.every(Buffer.isBuffer)).toBe(true);
		expect(Buffer.concat(chunks).equals(pass.getAsBuffer())).toBe(true);
	});

	it("returns a frozen map of the same files from getAsRaw", () => {
		const pass = buildPass();
		const raw = pass.getAsRaw();

		expect(Object.isFrozen(raw)).toBe(true);
		expect(Object.keys(raw).sort()).toEqual(
			[...EXPECTED_FILE_ORDER].sort(),
		);

		for (const [fileName, buffer] of Object.entries(assets)) {
			expect(raw[fileName].equals(buffer)).toBe(true);
		}
	});
});
