import { Stream } from "stream";
import * as Messages from "../lib/messages";
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
				Messages.BUNDLE.MIME_TYPE_MISSING,
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
				).toThrowError(Error, Messages.BUNDLE.CLOSED);
			});
		});

		describe("getAsBuffer", () => {
			it("should return a buffer", () => {
				addEmptyFilesToBundle(bundle);

				expect(bundle.getAsBuffer()).toBeInstanceOf(Buffer);
			});

			it("should freeze the bundle", () => {
				bundle.getAsBuffer();
				expect(bundle.isFrozen).toBe(true);
			});

			it("should throw error if a file is attempted to be added when bundle is frozen", () => {
				addEmptyFilesToBundle(bundle);

				bundle.getAsBuffer();

				expect(() =>
					bundle.addBuffer("icon.png", Buffer.alloc(0)),
				).toThrowError(Error, Messages.BUNDLE.CLOSED);
			});
		});

		describe("getAsRaw", () => {
			it("should freeze the bundle", () => {
				bundle.getAsRaw();
				expect(bundle.isFrozen).toBe(true);
			});

			it("should return an object with filePath as key and Buffer as value", () => {
				bundle.addBuffer("pass.json", Buffer.alloc(0));
				bundle.addBuffer("signature", Buffer.alloc(0));
				bundle.addBuffer("en.lproj/pass.strings", Buffer.alloc(0));
				bundle.addBuffer("en.lproj/icon.png", Buffer.alloc(0));

				const list = bundle.getAsRaw();

				expect(list["pass.json"]).not.toBeUndefined();
				expect(list["pass.json"]).toBeInstanceOf(Buffer);
				expect(list["signature"]).not.toBeUndefined();
				expect(list["signature"]).toBeInstanceOf(Buffer);
				expect(list["en.lproj/pass.strings"]).not.toBeUndefined();
				expect(list["en.lproj/pass.strings"]).toBeInstanceOf(Buffer);
				expect(list["en.lproj/icon.png"]).not.toBeUndefined();
				expect(list["en.lproj/icon.png"]).toBeInstanceOf(Buffer);
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
