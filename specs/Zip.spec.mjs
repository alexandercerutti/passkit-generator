// @ts-check
/**
 * The zip writer replaced `do-not-zip`, whose output shipped in every pass
 * issued by previous versions. These tests pin the replacement to that exact
 * byte layout, including the cases PKPass itself cannot reach, and check the
 * result against an independent reader.
 */

import { expect, it, describe } from "@jest/globals";
import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import { toArray as doNotZip } from "do-not-zip";
import { createZip } from "../lib/esm/Zip.js";
import { readZip, crc32 } from "./zipReader.mjs";
import { createAssets } from "./fixtures.mjs";

/**
 * @type {[string, {path: string, data: Buffer}[]][]}
 */
const CASES = [
	["an empty archive", []],
	["a single empty file", [{ path: "empty.txt", data: Buffer.alloc(0) }]],
	[
		"an empty file between two non-empty ones",
		[
			{ path: "a.txt", data: Buffer.from("A") },
			{ path: "b.txt", data: Buffer.alloc(0) },
			{ path: "c.txt", data: Buffer.from("CCC") },
		],
	],
	[
		"nested localization paths",
		[
			{
				path: "en.lproj/pass.strings",
				data: Buffer.from('"K" = "V";\n'),
			},
			{
				path: "it.lproj/pass.strings",
				data: Buffer.from('"K" = "W";\n'),
			},
		],
	],
	[
		"a file name longer than 255 bytes",
		[{ path: `${"x".repeat(300)}.png`, data: Buffer.from("data") }],
	],
	[
		"a payload larger than a megabyte",
		[{ path: "big.bin", data: crypto.randomBytes(1024 * 1024) }],
	],
	[
		"many small files",
		Array.from({ length: 200 }, (_, i) => ({
			path: `f${i}.txt`,
			data: Buffer.from(`payload-${i}`),
		})),
	],
	[
		"a realistic pass bundle",
		Object.entries(createAssets()).map(([path, data]) => ({ path, data })),
	],
];

describe("Zip", () => {
	describe("byte compatibility with do-not-zip", () => {
		it.each(CASES)("matches do-not-zip for %s", (_label, entries) => {
			expect(createZip(entries).toString("base64")).toBe(
				Buffer.from(doNotZip(entries)).toString("base64"),
			);
		});
	});

	describe("structure", () => {
		it("stores entries uncompressed, in the order given", () => {
			const entries = Object.entries(createAssets()).map(
				([path, data]) => ({ path, data }),
			);

			const { entries: read } = readZip(createZip(entries));

			expect(read.map((e) => e.name)).toEqual(entries.map((e) => e.path));

			for (let i = 0; i < entries.length; i++) {
				expect(read[i].data.equals(entries[i].data)).toBe(true);
			}
		});

		it("records a correct CRC-32 for every entry", () => {
			const entries = [
				{ path: "a.bin", data: crypto.randomBytes(1000) },
				{ path: "b.bin", data: Buffer.alloc(0) },
				{ path: "c.bin", data: crypto.randomBytes(70000) },
			];

			for (const entry of readZip(createZip(entries)).entries) {
				const source = entries.find((e) => e.path === entry.name);
				expect(entry.crc).toBe(crc32(source.data));
			}
		});

		it("points each central directory record at its local header", () => {
			const entries = Array.from({ length: 12 }, (_, i) => ({
				path: `f${i}.bin`,
				data: crypto.randomBytes(100 * (i + 1)),
			}));

			const archive = createZip(entries);
			const { entries: read, eocd } = readZip(archive);

			expect(eocd.entryCount).toBe(entries.length);

			/** readZip already cross-checks names and CRCs at each offset */
			for (const entry of read) {
				expect(archive.readUInt32LE(entry.offset)).toBe(0x04034b50);
			}
		});

		it("describes an empty archive with a bare end-of-central-directory record", () => {
			const archive = createZip([]);

			expect(archive.length).toBe(22);
			expect(readZip(archive).eocd).toEqual({
				entryCount: 0,
				centralDirectorySize: 0,
				centralDirectoryOffset: 0,
			});
		});
	});

	describe("scaling", () => {
		/**
		 * The implementation this replaced rebuilt the whole archive once per
		 * file, in a plain array of numbers, so cost grew with the square of the
		 * bundle size.
		 *
		 * Both writers are timed here on the same input, back to back, so the
		 * comparison calibrates itself against whatever else the machine happens
		 * to be doing. The observed margin on a 2MB bundle is several hundred
		 * times; the threshold is set far below that so this catches a
		 * regression to quadratic behaviour without being sensitive to load.
		 */

		it("assembles a large bundle far faster than do-not-zip did", () => {
			const entries = Array.from({ length: 32 }, (_, i) => ({
				path: `f${i}.bin`,
				data: crypto.randomBytes(64 * 1024),
			}));

			/** Best-of-N: the minimum is far less noisy than the mean */
			const best = (run) => {
				for (let i = 0; i < 2; i++) run();

				let fastest = Infinity;

				for (let i = 0; i < 5; i++) {
					const start = process.hrtime.bigint();
					run();
					const elapsed = Number(process.hrtime.bigint() - start);

					if (elapsed < fastest) {
						fastest = elapsed;
					}
				}

				return fastest;
			};

			const ours = best(() => createZip(entries));
			const previous = best(() => Buffer.from(doNotZip(entries)));

			expect(previous / ours).toBeGreaterThan(10);
		});
	});
});
