import { Stream } from "stream";
import { ZipFile } from "yazl";

export const filesSymbol = Symbol("bundleFiles");
export const freezeSymbol = Symbol("bundleFreeze");
const archiveSymbol = Symbol("zip");

namespace Mime {
	export type type = string;
	export type subtype = string;
}

/**
 * Defines a container ready to be distributed.
 * If no mimeType is passed to the constructor,
 * it will throw an error.
 */

export default class Bundle {
	private [filesSymbol]: { [key: string]: Buffer } = {};
	private [archiveSymbol] = new ZipFile();

	constructor(public mimeType: `${Mime.type}/${Mime.subtype}`) {
		if (!mimeType) {
			throw new Error("Cannot build Bundle. MimeType is missing");
		}
	}

	/**
	 * Creates a bundle and exposes the
	 * function to freeze it manually once
	 * completed.
	 *
	 * This was made to not expose freeze
	 * function outside of Bundle class.
	 *
	 * Normally, a bundle would get freezed
	 * when using getAsBuffer or getAsStream
	 * but when creating a PKPasses archive,
	 * we need to freeze the bundle so the
	 * user cannot add more files (we want to
	 * allow them to only the selected files)
	 * but also letting them choose how to
	 * export it.
	 *
	 * @param mimeType
	 * @returns
	 */

	static freezable(
		mimeType: `${Mime.type}/${Mime.subtype}`,
	): [Bundle, Function] {
		const bundle = new Bundle(mimeType);
		return [bundle, () => bundle[freezeSymbol]()];
	}

	/**
	 * Freezes the bundle so no more files
	 * can be added any further.
	 */

	protected [freezeSymbol]() {
		if (this.isFrozen) {
			return;
		}

		Object.freeze(this[filesSymbol]);
		this[archiveSymbol].end();
	}

	/**
	 * Tells if this bundle still allows files to be added.
	 * @returns false if files are allowed, true otherwise
	 */

	public get isFrozen() {
		return Object.isFrozen(this[filesSymbol]);
	}

	/**
	 * Allows files to be added to the bundle.
	 * If the bundle is closed, it will throw an error.
	 *
	 * @param fileName
	 * @param buffer
	 */

	public addBuffer(fileName: string, buffer: Buffer) {
		if (this.isFrozen) {
			throw new Error("Cannot add file. Bundle is closed.");
		}

		this[filesSymbol][fileName] = buffer;
		this[archiveSymbol].addBuffer(buffer, fileName);
	}

	/**
	 * Closes the bundle and returns it as a Buffer.
	 * Once closed, the bundle does not allow files
	 * to be added any further.
	 *
	 * @returns Promise<Buffer>
	 */

	public getAsBuffer(): Promise<Buffer> {
		const stream = this.getAsStream();
		const chunks = [];

		return new Promise((resolve) => {
			stream.on("data", (data: Buffer) => {
				chunks.push(data);
			});

			stream.on("end", () => resolve(Buffer.from(chunks)));
		});
	}

	/**
	 * Closes the bundle and returns it as a stream.
	 * Once closed, the bundle does not allow files
	 * to be added any further.
	 *
	 * @returns
	 */

	public getAsStream(): Stream {
		this[freezeSymbol]();
		return this[archiveSymbol].outputStream;
	}

	/**
	 * Closes the bundle and returns it as an object.
	 * This allows developers to choose a different way
	 * of serving, analyzing or zipping the file, outside the
	 * default compression system.
	 *
	 * @returns a frozen object containing files paths as key
	 * 		and Buffers as content.
	 */

	public getAsRaw(): { [filePath: string]: Buffer } {
		this[freezeSymbol]();
		return Object.freeze({ ...this[filesSymbol] });
	}
}
