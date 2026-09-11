import { Buffer } from "node:buffer";
import zlib from "node:zlib";

/**
 * A minimal, linear ZIP writer.
 *
 * Every entry is written with the STORE method: a .pkpass is almost entirely
 * PNG data, which is already deflated, so compressing it again costs time and
 * saves nothing.
 *
 * The archive is sized up front and written once into a single Buffer. The
 * previous implementation rebuilt a plain JavaScript array of numbers for the
 * whole archive on every file, which made assembling a bundle quadratic in its
 * total size.
 *
 * The byte layout is deliberately identical to the one this replaces, so
 * existing bundles stay reproducible byte for byte.
 */

export interface ZipEntry {
	path: string;
	data: Buffer;
}

const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;
const END_OF_CENTRAL_DIRECTORY_SIZE = 22;

const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;

/** Version 1.0: the lowest that can describe a stored, unencrypted entry */
const VERSION_NEEDED_TO_EXTRACT = 0x000a;
const VERSION_MADE_BY = 0x0014;
const METHOD_STORE = 0;

/**
 * File names are written the same way they were before: one byte per code
 * unit. Pass bundles only ever contain ASCII names — the asset names Wallet
 * expects, plus `<lang>.lproj/pass.strings` — so this is lossless in practice,
 * and keeping it means archives stay byte-identical to previously issued ones.
 */
const FILE_NAME_ENCODING = "latin1";

/**
 * node:zlib gained a native crc32 in Node 20.15. Falling back to a table keeps
 * the writer working on older runtimes and on environments that ship a reduced
 * zlib, at the cost of a millisecond or so per bundle.
 */
const nativeCrc32 = (zlib as unknown as { crc32?: (data: Buffer) => number })
	.crc32;

const CRC_TABLE = /* @__PURE__ */ (() => {
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

function crc32(data: Buffer): number {
	if (nativeCrc32) {
		return nativeCrc32(data) >>> 0;
	}

	let sum = -1;

	for (let i = 0; i < data.length; i++) {
		sum = (sum >>> 8) ^ CRC_TABLE[(sum ^ data[i]) & 0xff];
	}

	return (sum ^ -1) >>> 0;
}

/**
 * Writes the 26 bytes local and central headers share, starting at `offset`.
 * Fields left at zero — flags, modification time and date, extra field length —
 * are already zero because the archive is allocated zero-filled.
 *
 * @returns the offset just past the block that was written
 */

function writeCommonHeader(
	archive: Buffer,
	offset: number,
	crc: number,
	size: number,
	fileNameLength: number,
): number {
	archive.writeUInt16LE(VERSION_NEEDED_TO_EXTRACT, offset);
	archive.writeUInt16LE(METHOD_STORE, offset + 4);
	archive.writeUInt32LE(crc, offset + 10);
	/** Stored entries are their own compressed form, so both sizes agree */
	archive.writeUInt32LE(size, offset + 14);
	archive.writeUInt32LE(size, offset + 18);
	archive.writeUInt16LE(fileNameLength, offset + 22);

	return offset + 26;
}

/**
 * Packs the given entries into a ZIP archive.
 *
 * @param entries - files to store, in the order they should appear
 * @returns the complete archive
 */

export function createZip(entries: ZipEntry[]): Buffer {
	const fileNames: Buffer[] = new Array(entries.length);
	const checksums: number[] = new Array(entries.length);

	let localSectionSize = 0;
	let centralDirectorySize = 0;

	for (let i = 0; i < entries.length; i++) {
		const { path, data } = entries[i];
		const fileName = Buffer.from(path, FILE_NAME_ENCODING);

		fileNames[i] = fileName;
		checksums[i] = crc32(data);

		localSectionSize += LOCAL_HEADER_SIZE + fileName.length + data.length;
		centralDirectorySize += CENTRAL_HEADER_SIZE + fileName.length;
	}

	const archive = Buffer.alloc(
		localSectionSize + centralDirectorySize + END_OF_CENTRAL_DIRECTORY_SIZE,
	);

	let localOffset = 0;
	let centralOffset = localSectionSize;

	for (let i = 0; i < entries.length; i++) {
		const { data } = entries[i];
		const fileName = fileNames[i];
		const crc = checksums[i];

		/** The entry's own offset, recorded before the header is laid down */
		const entryOffset = localOffset;

		archive.writeUInt32LE(LOCAL_HEADER_SIGNATURE, localOffset);
		localOffset = writeCommonHeader(
			archive,
			localOffset + 4,
			crc,
			data.length,
			fileName.length,
		);

		localOffset += fileName.copy(archive, localOffset);
		localOffset += data.copy(archive, localOffset);

		archive.writeUInt32LE(CENTRAL_HEADER_SIGNATURE, centralOffset);
		archive.writeUInt16LE(VERSION_MADE_BY, centralOffset + 4);

		const afterCommon = writeCommonHeader(
			archive,
			centralOffset + 6,
			crc,
			data.length,
			fileName.length,
		);

		/**
		 * The ten bytes between the shared header and the offset — comment
		 * length, disk number, and the internal and external attributes —
		 * stay zero.
		 */

		archive.writeUInt32LE(entryOffset, afterCommon + 10);
		centralOffset = afterCommon + 14;
		centralOffset += fileName.copy(archive, centralOffset);
	}

	archive.writeUInt32LE(END_OF_CENTRAL_DIRECTORY_SIGNATURE, centralOffset);
	archive.writeUInt16LE(entries.length, centralOffset + 8);
	archive.writeUInt16LE(entries.length, centralOffset + 10);
	archive.writeUInt32LE(centralDirectorySize, centralOffset + 12);
	archive.writeUInt32LE(localSectionSize, centralOffset + 16);

	return archive;
}
