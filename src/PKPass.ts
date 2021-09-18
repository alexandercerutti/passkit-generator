import { Certificates } from "../lib/schemas";
import { default as Bundle, filesSymbol } from "./Bundle";

interface NamedBuffers {
	[key: string]: Buffer;
}

export class PKPass extends Bundle {
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
