/**
 * PKPass.from static method example.
 * Here it is showed manual model reading and
 * creating through another PKPass because in the other
 * examples, creation through templates is already shown
 */

import app from "./webserver";
import path from "path";
import { promises as fs } from "fs";
import { PKPass } from "passkit-generator";

import * as Utils from "passkit-generator/lib/utils";

// ******************************************** //
// *** CODE FROM GET MODEL FOLDER INTERNALS *** //
// ******************************************** //

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
		.join(path.sep);

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
		return getObjectFromModelFile(filePath, content, 1);
	});
}

// *************************** //
// *** EXAMPLE FROM NOW ON *** //
// *************************** //

/**
 * Reading model before answering. Maybe we need to do
 * something else with it.
 */

const modelPath = path.resolve(__dirname, `../models/examplePass.pass`);

const modelFilesList = await fs.readdir(modelPath);

const modelRecords = (
	await Promise.all(
		/**
		 * Obtaining flattened array of buffer records
		 * containing file name and the buffer itself.
		 *
		 * This goes also to read every nested l10n
		 * subfolder.
		 */

		modelFilesList.map((fileOrDirectoryPath) => {
			const fullPath = path.resolve(modelPath, fileOrDirectoryPath);

			return readFileOrDirectory(fullPath);
		}),
	)
)
	.flat(1)
	.reduce((acc, current) => ({ ...acc, ...current }), {});

/** Creating a PKPass Template */

const templatePass = new PKPass(modelRecords, {
	wwdr: path.resolve(__dirname, "../../certificates/WWDR.pem"),
	signerCert: path.resolve(__dirname, "../../certificates/signerCert.pem"),
	signerKey: path.resolve(__dirname, "../../certificates/signerKey.pem"),
	signerKeyPassphrase: "123456",
});

app.all(async function manageRequest(request, response) {
	const passName =
		request.params.modelName +
		"_" +
		new Date().toISOString().split("T")[0].replace(/-/gi, "");

	try {
		const pass = await PKPass.from(
			templatePass,
			request.body || request.params || request.query,
		);

		const stream = pass.getAsStream();

		response.set({
			"Content-type": pass.mimeType,
			"Content-disposition": `attachment; filename=${passName}.pkpass`,
		});

		stream.pipe(response);
	} catch (err) {
		console.log(err);

		response.set({
			"Content-type": "text/html",
		});

		response.send(err.message);
	}
});
