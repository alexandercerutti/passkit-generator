import FieldsArray from "../src/fieldsArray";
import { Certificates } from "../src/schemas";
import { default as Bundle, filesSymbol } from "./Bundle";

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
