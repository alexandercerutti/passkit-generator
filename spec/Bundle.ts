import { Stream } from "stream";
import { default as Bundle, filesSymbol } from "../lib/Bundle";

describe("Bundle", () => {
	let bundle: InstanceType<typeof Bundle>;

	beforeEach(() => {
		bundle = new Bundle("application/vnd.apple.pkpass");
	});

	describe("freezable", () => {
		it("should expose freeze method and bundle itself to be frozen", () => {
			const [bundle, freeze] = Bundle.freezable("any/any");
			freeze();
			expect(bundle.isFrozen).toBe(true);
		});
	});

	describe("mimeType", () => {
		it("should throw an error if no mime-type is specified in the constructor", () => {
			// @ts-expect-error
			expect(() => new Bundle()).toThrowError(
				Error,
				"Cannot build Bundle. MimeType is missing",
			);
		});

		it("should expose the mime-type as public property", () => {
			expect(bundle.mimeType).toBe("application/vnd.apple.pkpass");
		});
	});

	describe("addBuffer", () => {
		it("should allow to add buffers", () => {
			const buffer = Buffer.alloc(0);
			bundle.addBuffer("pass.json", buffer);

			expect(bundle[filesSymbol]).toEqual({ "pass.json": buffer });
		});
	});

	describe("exporting", () => {
		describe("getAsStream", () => {
			it("should return a stream", () => {
				addEmptyFilesToBundle(bundle);

				expect(bundle.getAsStream()).toBeInstanceOf(Stream);
			});

			it("should freeze the bundle", () => {
				bundle.getAsStream();
				expect(bundle.isFrozen).toBe(true);
			});

			it("should throw error if a file is attempted to be added when bundle is frozen", () => {
				addEmptyFilesToBundle(bundle);

				bundle.getAsStream();

				expect(() =>
					bundle.addBuffer("icon.png", Buffer.alloc(0)),
				).toThrowError(Error, "Cannot add file. Bundle is closed.");
			});
		});

		describe("getAsBuffer", () => {
			it("should return a buffer", async () => {
				addEmptyFilesToBundle(bundle);

				expect(await bundle.getAsBuffer()).toBeInstanceOf(Buffer);
			});

			it("should freeze the bundle", async () => {
				await bundle.getAsBuffer();
				expect(bundle.isFrozen).toBe(true);
			});

			it("should throw error if a file is attempted to be added when bundle is frozen", async () => {
				addEmptyFilesToBundle(bundle);

				await bundle.getAsBuffer();

				expect(() =>
					bundle.addBuffer("icon.png", Buffer.alloc(0)),
				).toThrowError(Error, "Cannot add file. Bundle is closed.");
			});
		});
	});
});

function addEmptyFilesToBundle(bundle: Bundle) {
	const buffer = Buffer.alloc(0);
	bundle.addBuffer("pass.json", buffer);
	bundle.addBuffer("icon@2x.png", buffer);
	bundle.addBuffer("icon@3x.png", buffer);
}
