import * as path from "path";
import * as Utils from "./utils";
import * as Messages from "./messages";
import { promises as fs } from "fs";
import type { Buffer } from "buffer";

/**
 * Reads the model folder contents
 *
 * @param model
 * @returns A promise of an object containing all
 * 		filePaths and the relative buffer
 */

export default async function getModelFolderContents(
	model: string,
): Promise<{ [filePath: string]: Buffer }> {
	try {
		const modelPath = `${model}${(!path.extname(model) && ".pass") || ""}`;
		const modelFilesList = await fs.readdir(modelPath);

		// No dot-starting files, manifest and signature
		const filteredModelRecords = Utils.removeHidden(modelFilesList).filter(
			(f) =>
				!/(manifest|signature)/i.test(f) &&
				/.+$/.test(path.parse(f).ext),
		);

		const modelRecords = (
			await Promise.all(
				/**
				 * Obtaining flattened array of buffer records
				 * containing file name and the buffer itself.
				 *
				 * This goes also to read every nested l10n
				 * subfolder.
				 */

				filteredModelRecords.map((fileOrDirectoryPath) => {
					const fullPath = path.resolve(
						modelPath,
						fileOrDirectoryPath,
					);

					return readFileOrDirectory(fullPath);
				}),
			)
		)
			.flat(1)
			.reduce((acc, current) => ({ ...acc, ...current }), {});

		return modelRecords;
	} catch (_err) {
		const err = _err as NodeJS.ErrnoException;

		if (err?.code === "ENOENT") {
			if (err.syscall === "open") {
				// file opening failed
				throw new Error(
					Messages.format(
						Messages.MODELS.FILE_NO_OPEN,
						JSON.stringify(err),
					),
				);
			} else if (err.syscall === "scandir") {
				// directory reading failed
				throw new Error(
					Messages.format(Messages.MODELS.DIR_NOT_FOUND, err.path),
				);
			}
		}

		throw err;
	}
}

/**
 * Reads sequentially
 * @param filePath
 * @returns
 */

async function readFileOrDirectory(filePath: string) {
	if ((await fs.lstat(filePath)).isDirectory()) {
		return Promise.all(await readDirectory(filePath));
	} else {
		return fs
			.readFile(filePath)
			.then((content) => getObjectFromModelFile(filePath, content, 1));
	}
}

/**
 * Returns an object containing the parsed fileName
 * from a path along with its content.
 *
 * @param filePath
 * @param content
 * @param depthFromEnd - used to preserve localization lproj content
 * @returns
 */

function getObjectFromModelFile(
	filePath: string,
	content: Buffer,
	depthFromEnd: number,
) {
	const fileComponents = filePath.split(path.sep);
	const fileName = fileComponents
		.slice(fileComponents.length - depthFromEnd)
		.join("/");

	return { [fileName]: content };
}

/**
 * Reads a directory and returns all the files in it
 * as an Array<Promise>
 *
 * @param filePath
 * @returns
 */

async function readDirectory(filePath: string) {
	const dirContent = await fs.readdir(filePath).then(Utils.removeHidden);

	return dirContent.map(async (fileName) => {
		const content = await fs.readFile(path.resolve(filePath, fileName));
		return getObjectFromModelFile(
			path.resolve(filePath, fileName),
			content,
			2,
		);
	});
}
