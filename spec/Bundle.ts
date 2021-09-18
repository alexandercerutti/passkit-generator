import { Stream } from "stream";
import { default as Bundle, filesSymbol } from "../lib/Bundle";

describe("Bundle", () => {
	let bundle: InstanceType<typeof Bundle>;

	beforeEach(() => {
		bundle = new Bundle("application/vnd.apple.pkpass");
	});

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

	it("should allow to add buffers", () => {
		const buffer = Buffer.alloc(0);
		bundle.addBuffer("pass.json", buffer);

		expect(bundle[filesSymbol]).toEqual({ "pass.json": buffer });
	});

	it("should throw error if freezed", async () => {
		addEmptyFilesToBundle(bundle);

		await bundle.getAsBuffer();

		expect(() =>
			bundle.addBuffer("icon.png", Buffer.alloc(0)),
		).toThrowError(Error, "Cannot add file. Bundle is closed.");
	});

	it("should return a stream with 'getAsStream'", () => {
		addEmptyFilesToBundle(bundle);

		expect(bundle.getAsStream()).toBeInstanceOf(Stream);
	});

	it("should return a buffer with 'getAsBuffer'", async () => {
		addEmptyFilesToBundle(bundle);

		expect(await bundle.getAsBuffer()).toBeInstanceOf(Buffer);
	});
});

function addEmptyFilesToBundle(bundle: Bundle) {
	const buffer = Buffer.alloc(0);
	bundle.addBuffer("pass.json", buffer);
	bundle.addBuffer("icon@2x.png", buffer);
	bundle.addBuffer("icon@3x.png", buffer);
}
