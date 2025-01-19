import * as path from "node:path";
import { promises as fs } from "node:fs";
import * as Utils from "./utils.js";
import * as Messages from "./messages.js";

/**
 * Reads the model folder contents
 *
 * @param model
 * @returns A promise of an object containing all
 * 		filePaths and the relative buffer
 */

export default async function getModelFolderContents(
	model: string,
): Promise<{ [filePath: string]: Uint8Array }> {
	try {
		const modelPath = `${model}${(!path.extname(model) && ".pass") || ""}`;
		const modelFilesList = await fs.readdir(modelPath);

		// No dot-starting files, manifest and signature and only files with an extension
		const modelSuitableRootPaths = Utils.removeHidden(
			modelFilesList,
		).filter(
			(f) =>
				!/(manifest|signature)/i.test(f) &&
				/.+$/.test(path.parse(f).ext),
		);

		const modelRecords = await Promise.all(
			modelSuitableRootPaths.map((fileOrDirectoryPath) =>
				readFileOrDirectory(
					path.resolve(modelPath, fileOrDirectoryPath),
				),
			),
		);

		return Object.fromEntries(modelRecords.flat(1));
	} catch (err) {
		if (!isErrorErrNoException(err) || !isMissingFileError(err)) {
			throw err;
		}

		if (isFileReadingFailure(err)) {
			throw new Error(
				Messages.format(
					Messages.MODELS.FILE_NO_OPEN,
					JSON.stringify(err),
				),
			);
		}

		if (isDirectoryReadingFailure(err)) {
			throw new Error(
				Messages.format(Messages.MODELS.DIR_NOT_FOUND, err.path),
			);
		}

		throw err;
	}
}

function isErrorErrNoException(err: unknown): err is NodeJS.ErrnoException {
	return Object.prototype.hasOwnProperty.call(err, "errno");
}

function isMissingFileError(
	err: unknown,
): err is NodeJS.ErrnoException & { code: "ENOENT" } {
	return (err as NodeJS.ErrnoException).code === "ENOENT";
}

function isDirectoryReadingFailure(
	err: NodeJS.ErrnoException,
): err is NodeJS.ErrnoException & { syscall: "scandir" } {
	return err.syscall === "scandir";
}

function isFileReadingFailure(
	err: NodeJS.ErrnoException,
): err is NodeJS.ErrnoException & { syscall: "open" } {
	return err.syscall === "open";
}

/**
 * Allows reading both a whole directory or a set of
 * file in the same flow
 *
 * @param filePath
 * @returns
 */

async function readFileOrDirectory(
	filePath: string,
): Promise<[key: string, content: Uint8Array][]> {
	const stats = await fs.lstat(filePath);

	if (stats.isDirectory()) {
		return readFilesInDirectory(filePath);
	}

	return getFileContents(filePath).then((result) => [result]);
}

/**
 * Reads a directory and returns all
 * the files in it
 *
 * @param filePath
 * @returns
 */

async function readFilesInDirectory(
	filePath: string,
): Promise<Awaited<ReturnType<typeof getFileContents>>[]> {
	const dirContent = await fs.readdir(filePath).then(Utils.removeHidden);

	return Promise.all(
		dirContent.map((fileName) =>
			getFileContents(path.resolve(filePath, fileName), 2),
		),
	);
}

/**
 * @param filePath
 * @param pathSlicesDepthFromEnd used to preserve localization lproj content
 * @returns
 */

async function getFileContents(
	filePath: string,
	pathSlicesDepthFromEnd: number = 1,
): Promise<[key: string, content: Uint8Array]> {
	const fileComponents = filePath.split(path.sep);
	const fileName = fileComponents
		.slice(fileComponents.length - pathSlicesDepthFromEnd)
		.join("/");

	const content = await fs.readFile(filePath);

	return [fileName, Uint8Array.from(content)];
}
