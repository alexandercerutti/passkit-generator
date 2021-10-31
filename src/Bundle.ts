import { Readable, Stream } from "stream";
import * as Messages from "./messages";
import * as zip from "do-not-zip";

export const filesSymbol = Symbol("bundleFiles");
export const freezeSymbol = Symbol("bundleFreeze");
export const mimeTypeSymbol = Symbol("bundleMimeType");

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
	private [mimeTypeSymbol]: string;

	constructor(mimeType: `${Mime.type}/${Mime.subtype}`) {
		if (!mimeType) {
			throw new Error(Messages.BUNDLE.MIME_TYPE_MISSING);
		}

		this[mimeTypeSymbol] = mimeType;
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
	 * Retrieves bundle's mimeType
	 */

	public get mimeType() {
		return this[mimeTypeSymbol];
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
			throw new Error(Messages.BUNDLE.CLOSED);
		}

		this[filesSymbol][fileName] = buffer;
	}

	/**
	 * Closes the bundle and returns it as a Buffer.
	 * Once closed, the bundle does not allow files
	 * to be added any further.
	 *
	 * @returns Buffer
	 */

	public getAsBuffer(): Buffer {
		this[freezeSymbol]();
		return zip.toBuffer(createZipFilesMap(this[filesSymbol]));
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
		return Readable.from(
			zip.toBuffer(createZipFilesMap(this[filesSymbol])),
		);
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

/**
 * Creates a files map for do-not-zip
 *
 * @param files
 * @returns
 */

function createZipFilesMap(files: { [key: string]: Buffer }) {
	return Object.entries(files).map(([path, data]) => ({
		path,
		data,
	}));
}
