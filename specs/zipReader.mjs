// @ts-check
/**
 * A deliberately small, dependency-free ZIP reader.
 *
 * It only understands STORE (uncompressed) entries, which is all a .pkpass
 * ever contains. Parsing the archive independently — rather than round-tripping
 * through the same writer that produced it — is what makes it useful as a
 * test oracle: a writer bug cannot hide behind a matching reader bug.
 */

import { Buffer } from "node:buffer";

const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const EOCD_SIGNATURE = 0x06054b50;

const CRC_TABLE = (() => {
	const table = new Int32Array(256);

	for (let n = 0; n < 256; n++) {
		let c = n;

		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}

		table[n] = c;
	}

	return table;
})();

/**
 * @param {Buffer} buffer
 * @returns {number} unsigned CRC-32
 */
export function crc32(buffer) {
	let sum = -1;

	for (let i = 0; i < buffer.length; i++) {
		sum = (sum >>> 8) ^ CRC_TABLE[(sum ^ buffer[i]) & 0xff];
	}

	return (sum ^ -1) >>> 0;
}

/**
 * Reads an archive and returns its entries in central-directory order,
 * asserting the structure as it goes.
 *
 * @param {Buffer} archive
 * @returns {{ entries: { name: string, data: Buffer, crc: number, offset: number }[], eocd: { entryCount: number, centralDirectorySize: number, centralDirectoryOffset: number } }}
 */
export function readZip(archive) {
	const eocdOffset = findEndOfCentralDirectory(archive);

	if (eocdOffset < 0) {
		throw new Error("End of central directory record not found");
	}

	const entryCount = archive.readUInt16LE(eocdOffset + 10);
	const centralDirectorySize = archive.readUInt32LE(eocdOffset + 12);
	const centralDirectoryOffset = archive.readUInt32LE(eocdOffset + 16);

	if (centralDirectoryOffset + centralDirectorySize !== eocdOffset) {
		throw new Error(
			`Central directory does not end where the EOCD begins (${centralDirectoryOffset} + ${centralDirectorySize} !== ${eocdOffset})`,
		);
	}

	const entries = [];
	let cursor = centralDirectoryOffset;

	for (let i = 0; i < entryCount; i++) {
		if (archive.readUInt32LE(cursor) !== CENTRAL_HEADER_SIGNATURE) {
			throw new Error(`Bad central directory header at ${cursor}`);
		}

		const compressionMethod = archive.readUInt16LE(cursor + 10);
		const crc = archive.readUInt32LE(cursor + 16);
		const compressedSize = archive.readUInt32LE(cursor + 20);
		const uncompressedSize = archive.readUInt32LE(cursor + 24);
		const nameLength = archive.readUInt16LE(cursor + 28);
		const extraLength = archive.readUInt16LE(cursor + 30);
		const commentLength = archive.readUInt16LE(cursor + 32);
		const localOffset = archive.readUInt32LE(cursor + 42);
		const name = archive
			.subarray(cursor + 46, cursor + 46 + nameLength)
			.toString("latin1");

		if (compressionMethod !== 0) {
			throw new Error(
				`Entry "${name}" uses compression method ${compressionMethod}; only STORE is supported`,
			);
		}

		if (compressedSize !== uncompressedSize) {
			throw new Error(
				`Entry "${name}" is stored but its sizes disagree (${compressedSize} vs ${uncompressedSize})`,
			);
		}

		/** Cross-check the local header against the central directory */

		if (archive.readUInt32LE(localOffset) !== LOCAL_HEADER_SIGNATURE) {
			throw new Error(`Bad local header for "${name}" at ${localOffset}`);
		}

		const localNameLength = archive.readUInt16LE(localOffset + 26);
		const localExtraLength = archive.readUInt16LE(localOffset + 28);
		const localName = archive
			.subarray(localOffset + 30, localOffset + 30 + localNameLength)
			.toString("latin1");

		if (localName !== name) {
			throw new Error(
				`Local header name "${localName}" disagrees with central directory name "${name}"`,
			);
		}

		if (archive.readUInt32LE(localOffset + 14) !== crc) {
			throw new Error(`CRC disagrees between headers for "${name}"`);
		}

		const dataStart = localOffset + 30 + localNameLength + localExtraLength;
		const data = archive.subarray(dataStart, dataStart + uncompressedSize);

		if (crc32(data) !== crc) {
			throw new Error(`CRC mismatch for "${name}"`);
		}

		entries.push({ name, data, crc, offset: localOffset });
		cursor += 46 + nameLength + extraLength + commentLength;
	}

	return {
		entries,
		eocd: { entryCount, centralDirectorySize, centralDirectoryOffset },
	};
}

/**
 * Convenience view of an archive as a plain name -> Buffer map.
 *
 * @param {Buffer} archive
 * @returns {{[fileName: string]: Buffer}}
 */
export function readZipEntries(archive) {
	/** @type {{[fileName: string]: Buffer}} */
	const out = {};

	for (const entry of readZip(archive).entries) {
		out[entry.name] = entry.data;
	}

	return out;
}

function findEndOfCentralDirectory(archive) {
	/** The EOCD is 22 bytes plus a trailing comment we never write */
	for (let i = archive.length - 22; i >= 0; i--) {
		if (archive.readUInt32LE(i) === EOCD_SIGNATURE) {
			return i;
		}
	}

	return -1;
}
