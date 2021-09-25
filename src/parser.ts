import * as path from "path";
import forge from "node-forge";
import formatMessage, { ERROR, DEBUG } from "./messages";
import * as Schemas from "./schemas";
import {
	removeHidden,
	splitBufferBundle,
	getAllFilesWithName,
	hasFilesWithName,
	deletePersonalization,
} from "./utils";
import { promises as fs } from "fs";
import debug from "debug";

const prsDebug = debug("Personalization");

/**
 * Performs checks on the passed model to
 * determine how to parse it
 * @param model
 */

export async function getModelContents(model: Schemas.FactoryOptions["model"]) {
	let modelContents: Schemas.PartitionedBundle;

	if (typeof model === "string") {
		modelContents = await getModelFolderContents(model);
	} else if (typeof model === "object" && Object.keys(model).length) {
		modelContents = getModelBufferContents(model);
	} else {
		throw new Error(formatMessage(ERROR.MODEL_NOT_VALID));
	}

	const modelFiles = Object.keys(modelContents.bundle);
	const isModelInitialized =
		modelFiles.includes("pass.json") &&
		hasFilesWithName("icon", modelFiles, "startsWith");

	if (!isModelInitialized) {
		throw new Error(
			formatMessage(ERROR.MODEL_UNINITIALIZED, "parse result"),
		);
	}

	// ======================= //
	// *** Personalization *** //
	// ======================= //

	const personalizationJsonFile = "personalization.json";

	if (!modelFiles.includes(personalizationJsonFile)) {
		return modelContents;
	}

	const logoFullNames = getAllFilesWithName(
		"personalizationLogo",
		modelFiles,
		"startsWith",
	);
	if (
		!(
			logoFullNames.length &&
			modelContents.bundle[personalizationJsonFile].length
		)
	) {
		deletePersonalization(modelContents.bundle, logoFullNames);
		return modelContents;
	}

	try {
		const parsedPersonalization = JSON.parse(
			modelContents.bundle[personalizationJsonFile].toString("utf8"),
		);
		const isPersonalizationValid = Schemas.isValid(
			parsedPersonalization,
			Schemas.Personalization,
		);

		if (!isPersonalizationValid) {
			[...logoFullNames, personalizationJsonFile].forEach(
				(file) => delete modelContents.bundle[file],
			);

			return modelContents;
		}
	} catch (err) {
		prsDebug(formatMessage(DEBUG.PRS_INVALID, err));
		deletePersonalization(modelContents.bundle, logoFullNames);
	}

	return modelContents;
}

/**
 * Reads the model folder contents
 *
 * @param model
 * @returns A promise of an object containing all
 * 		filePaths and the relative buffer
 */

export async function getModelFolderContents(
	model: string,
): Promise<{ [filePath: string]: Buffer }> {
	try {
		const modelPath = `${model}${(!path.extname(model) && ".pass") || ""}`;
		const modelFilesList = await fs.readdir(modelPath);

		// No dot-starting files, manifest and signature
		const filteredModelRecords = removeHidden(modelFilesList).filter(
			(f) =>
				!/(manifest|signature)/i.test(f) &&
				/.+$/.test(path.parse(f).ext),
		);

		/* 		const isModelInitialized =
			filteredFiles.length &&
			hasFilesWithName("icon", filteredFiles, "startsWith");

		// Icon is required to proceed
		if (!isModelInitialized) {
			throw new Error(
				formatMessage(
					ERROR.MODEL_UNINITIALIZED,
					path.parse(model).name,
				),
			);
		} */

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
	} catch (err) {
		if (err?.code === "ENOENT") {
			if (err.syscall === "open") {
				// file opening failed
				throw new Error(
					formatMessage(ERROR.MODELF_NOT_FOUND, err.path),
				);
			} else if (err.syscall === "scandir") {
				// directory reading failed
				const pathContents = (err.path as string).split(/(\/|\\\?)/);
				throw new Error(
					formatMessage(
						ERROR.MODELF_FILE_NOT_FOUND,
						pathContents[pathContents.length - 1],
					),
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
	const dirContent = await fs.readdir(filePath).then(removeHidden);

	return dirContent.map(async (fileName) => {
		const content = await fs.readFile(path.resolve(filePath, fileName));
		return getObjectFromModelFile(filePath, content, 1);
	});
}

/**
 * Analyzes the passed buffer model and splits it to
 * return buffers and localization files buffers.
 * @param model
 */

export function getModelBufferContents(
	model: Schemas.BundleUnit,
): Schemas.PartitionedBundle {
	const rawBundle = removeHidden(
		Object.keys(model),
	).reduce<Schemas.BundleUnit>((acc, current) => {
		// Checking if current file is one of the autogenerated ones or if its
		// content is not available

		if (/(manifest|signature)/.test(current) || !model[current]) {
			return acc;
		}

		return { ...acc, [current]: model[current] };
	}, {});

	const bundleKeys = Object.keys(rawBundle);

	const isModelInitialized =
		bundleKeys.length && hasFilesWithName("icon", bundleKeys, "startsWith");

	// Icon is required to proceed
	if (!isModelInitialized) {
		throw new Error(formatMessage(ERROR.MODEL_UNINITIALIZED, "Buffers"));
	}

	// separing localization folders from bundle files
	const [l10nBundle, bundle] = splitBufferBundle(rawBundle);

	return {
		bundle,
		l10nBundle,
	};
}

/**
 * Reads certificate contents, if the passed content is a path,
 * and parses them as a PEM.
 * @param options
 */

type flatCertificates = Omit<Schemas.Certificates, "signerKey"> & {
	signerKey: string;
};

export async function readCertificatesFromOptions(
	options: Schemas.Certificates,
): Promise<Schemas.CertificatesSchema> {
	if (
		!(
			options &&
			Object.keys(options).length &&
			Schemas.isValid(options, Schemas.CertificatesSchema)
		)
	) {
		throw new Error(formatMessage(ERROR.CP_NO_CERTS));
	}

	let signerKey: string;

	if (typeof options.signerKey === "object") {
		signerKey = options.signerKey?.keyFile;
	} else {
		signerKey = options.signerKey;
	}

	// if the signerKey is an object, we want to get
	// all the real contents and don't care of passphrase
	const flattenedDocs = Object.assign({}, options, {
		signerKey,
	}) as flatCertificates;

	// We read the contents
	const rawContentsPromises = Object.keys(flattenedDocs).map((key) => {
		const content = flattenedDocs[key];

		if (!!path.parse(content).ext) {
			// The content is a path to the document
			return fs.readFile(path.resolve(content), { encoding: "utf8" });
		} else {
			// Content is the real document content
			return Promise.resolve(content);
		}
	});

	try {
		const parsedContents = await Promise.all(rawContentsPromises);
		const pemParsedContents = parsedContents.map((file, index) => {
			const certName = Object.keys(options)[index];
			const passphrase =
				(typeof options.signerKey === "object" &&
					options.signerKey?.passphrase) ||
				undefined;

			const pem = parsePEM(certName, file, passphrase);

			if (!pem) {
				throw new Error(formatMessage(ERROR.INVALID_CERTS, certName));
			}

			return { [certName]: pem };
		});

		return Object.assign({}, ...pemParsedContents);
	} catch (err) {
		if (!err.path) {
			throw err;
		}

		throw new Error(
			formatMessage(ERROR.INVALID_CERT_PATH, path.parse(err.path).base),
		);
	}
}

/**
 * Parses the PEM-formatted passed text (certificates)
 *
 * @param element - Text content of .pem files
 * @param passphrase - passphrase for the key
 * @returns The parsed certificate or key in node forge format
 */

function parsePEM(pemName: string, element: string, passphrase?: string) {
	if (pemName === "signerKey" && passphrase) {
		return forge.pki.decryptRsaPrivateKey(element, String(passphrase));
	} else {
		return forge.pki.certificateFromPem(element);
	}
}
