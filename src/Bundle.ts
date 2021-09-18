import { Stream } from "stream";
import { ZipFile } from "yazl";

export const filesSymbol = Symbol("bundleFiles");
const bundleStateSymbol = Symbol("state");
const archiveSymbol = Symbol("zip");

enum BundleState {
	CLOSED = 0,
	OPEN = 1,
}

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
	private [bundleStateSymbol]: BundleState = BundleState.OPEN;
	private [filesSymbol]: { [key: string]: Buffer } = {};
	private [archiveSymbol] = new ZipFile();

	constructor(public mimeType: `${Mime.type}/${Mime.subtype}`) {
		if (!mimeType) {
			throw new Error("Cannot build Bundle. MimeType is missing");
		}
	}

	/**
	 * @EXPERIMENTAL
	 *
	 * @param mimeType
	 */

	static autoFreezable(mimeType: `${Mime.type}/${Mime.subtype}`): Bundle {
		const bundle = new Bundle(mimeType);

		/**
		 * @TODO
		 * Might not be the best idea I might have had.
		 * I have to test this further more to check if
		 * actually we can leverage of this event loop feature
		 * to freeze it automatically once we processed every
		 * promise for bundling;
		 */

		setTimeout(bundle.freeze, 0);

		return bundle;
	}

	/**
	 * Freezes / Closes the bundle so no more files
	 * can be added any further.
	 */

	protected freeze() {
		if (this[bundleStateSymbol] === BundleState.CLOSED) {
			return;
		}

		this[bundleStateSymbol] = BundleState.CLOSED;
		this[archiveSymbol].end();
	}

	/**
	 * Allows files to be added to the bundle.
	 * If the bundle is closed, it will throw an error.
	 *
	 * @param fileName
	 * @param buffer
	 */

	public addBuffer(fileName: string, buffer: Buffer) {
		if (this[bundleStateSymbol] === BundleState.CLOSED) {
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
		this.freeze();
		return this[archiveSymbol].outputStream;
	}
}
