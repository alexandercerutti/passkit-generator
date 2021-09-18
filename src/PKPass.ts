import FieldsArray from "../src/fieldsArray";
import { Certificates } from "../src/schemas";
import { default as Bundle, filesSymbol } from "./Bundle";
import { getModelFolderContents } from "./parser";

const fieldKeysPoolSymbol = Symbol("fieldKeysPoolSymbol");

interface NamedBuffers {
	[key: string]: Buffer;
}

export class PKPass extends Bundle {
	private [fieldKeysPoolSymbol] = new Set<string>();
	public primaryFields /*****/ = new FieldsArray(this[fieldKeysPoolSymbol]);
	public secondaryFields /***/ = new FieldsArray(this[fieldKeysPoolSymbol]);
	public auxiliaryFields /***/ = new FieldsArray(this[fieldKeysPoolSymbol]);
	public headerFields /******/ = new FieldsArray(this[fieldKeysPoolSymbol]);
	public backFields /********/ = new FieldsArray(this[fieldKeysPoolSymbol]);

	/**
	 * Either create a pass from another one
	 * or a disk path.
	 *
	 * @param source
	 * @returns
	 */

	static async from(source: PKPass | string): Promise<PKPass> {
		let certificates: Certificates = undefined;
		let buffers: NamedBuffers = undefined;

		if (source instanceof PKPass) {
			/** Cloning is happening here */
			certificates = source.certificates;
			buffers = {};

			const buffersEntries = Object.entries(source[filesSymbol]);

			/** Cloning all the buffers to prevent unwanted edits */
			for (let i = 0; i < buffersEntries.length; i++) {
				const [fileName, contentBuffer] = buffersEntries[i];

				buffers[fileName] = Buffer.from(contentBuffer);
			}
		} else {
			/** Disk model reading is happening here */

			/**
			 * @TODO Rename bundles in something else.
			 * @TODO determine how to use localized files
			 */

			const { bundle, l10nBundle } = await getModelFolderContents(source);

			buffers = bundle;
		}

		return new PKPass(buffers, certificates);
	}

	constructor(buffers: NamedBuffers, certificates: Certificates) {
		super("application/vnd.apple.pkpass");

		const buffersEntries = Object.entries(buffers);

		for (
			let i = buffersEntries.length, buffer: [string, Buffer];
			(buffer = buffersEntries[--i]);

		) {
			const [fileName, contentBuffer] = buffer;
			this.addBuffer(fileName, contentBuffer);
		}
	}
}
