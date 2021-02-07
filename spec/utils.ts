import { splitBufferBundle } from "../lib/utils";
import type { BundleUnit } from "../lib/schema";

describe("splitBufferBundle", () => {
	it("should split the bundle in language-organized files buffers and normal files with valid bundleUnit passed", () => {
		const zeroBuffer = Buffer.alloc(0);
		const payload: BundleUnit = {
			"en.lproj/thumbnail@2x.png": zeroBuffer,
			"de.lproj/background@2x.png": zeroBuffer,
			"it.lproj/thumbnail@2x.png": zeroBuffer,
			"thumbnail@2x.png": zeroBuffer,
			"background.png": zeroBuffer
		};

		const result = splitBufferBundle(payload);

		expect(result).toBeDefined();
		expect(result.length).toBe(2);
		expect(result[0]).toEqual({
			"en.lproj": {
				"thumbnail@2x.png": zeroBuffer,
			},
			"de.lproj": {
				"background@2x.png": zeroBuffer,
			},
			"it.lproj": {
				"thumbnail@2x.png": zeroBuffer,
			}
		});
		expect(result[1]).toEqual({
			"thumbnail@2x.png": zeroBuffer,
			"background.png": zeroBuffer
		});
	});

	it("should return empty partitionedBufferBundle if BundleUnit is empty object", () => {
		const result = splitBufferBundle({});

		expect(result).toBeDefined();
		expect(result.length).toBe(2);
		expect(result[0]).toEqual({});
		expect(result[1]).toEqual({});
	});

	it("should return empty partitionedBufferBundle if BundleUnit is undefined", () => {
		const resultUndefined = splitBufferBundle(undefined);
		const resultNull = splitBufferBundle(null);

		expect(resultUndefined).toBeDefined();
		expect(resultUndefined.length).toBe(2);
		expect(resultUndefined[0]).toEqual({});
		expect(resultUndefined[1]).toEqual({});

		expect(resultNull).toBeDefined();
		expect(resultNull.length).toBe(2);
		expect(resultNull[0]).toEqual({});
		expect(resultNull[1]).toEqual({});
	});
});
