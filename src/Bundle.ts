import { ReadableStream } from "node:stream/web";
import { toArray as zipToArray } from "do-not-zip";
import * as Messages from "./messages.js";

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
	private [filesSymbol]: { [key: string]: Uint8Array } = {};
	private [mimeTypeSymbol]: string;

	public constructor(mimeType: `${Mime.type}/${Mime.subtype}`) {
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

	public static freezable(
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

	private [freezeSymbol]() {
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
	 * Returns a copy of the current list of buffers
	 * that have been added to the class.
	 *
	 * It does not include translation files, manifest
	 * and signature.
	 *
	 * Final files list might differ due to export
	 * conditions.
	 */

	public get files() {
		return Object.keys(this[filesSymbol]);
	}

	/**
	 * Allows files to be added to the bundle.
	 * If the bundle is closed, it will throw an error.
	 *
	 * @param fileName
	 * @param buffer
	 */

	public addBuffer(fileName: string, buffer: Uint8Array) {
		if (this.isFrozen) {
			throw new Error(Messages.BUNDLE.CLOSED);
		}

		this[filesSymbol][fileName] = buffer;
	}

	/**
	 * Closes the bundle and returns it as a Uint8Array.
	 * Once closed, the bundle does not allow files
	 * to be added any further.
	 *
	 * @returns Uint8Array
	 */

	public getAsBuffer(): Uint8Array {
		this[freezeSymbol]();
		return new Uint8Array(zipToArray(createZipFilesMap(this[filesSymbol])));
	}

	/**
	 * Closes the bundle and returns it as a stream.
	 * Once closed, the bundle does not allow files
	 * to be added any further.
	 *
	 * @returns
	 */

	public getAsStream(): ReadableStream {
		this[freezeSymbol]();

		return ReadableStream.from([
			Uint8Array.from(zipToArray(createZipFilesMap(this[filesSymbol]))),
		]);
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

	public getAsRaw(): { [filePath: string]: Uint8Array } {
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

function createZipFilesMap(files: { [key: string]: Uint8Array }) {
	return Object.entries(files).map(([path, data]) => ({
		path,
		data,
	}));
}
