import { Pass } from "./pass";
import { Certificates, isValid } from "./schema";

import { promisify } from "util";
import { readFile as _readFile, readdir as _readdir } from "fs";
import * as path from "path";
import forge from "node-forge";
import formatMessage from "./messages";

const readDir = promisify(_readdir);
const readFile = promisify(_readFile);

interface FactoryOptions {
	model: string | { [key: string]: Buffer },
	certificates: Certificates;
	overrides?: Object;
}

async function createPass(options: FactoryOptions) {
	if (!(options && Object.keys(options).length)) {
		throw new Error("Unable to create Pass: no options were passed");
	}

	// Voglio leggere i certificati
	// Voglio leggere il model (se non è un oggetto)

	/* Model checks */

	if (!options.model) {
		throw new Error("Unable to create Pass: no model passed");
	}

	if (typeof options.model !== "string" && typeof options.model !== "object") {
		throw new Error("Unable to create Pass: unsupported type");
	}

	if (typeof options.model === "object" && !Object.keys(options.model).length) {
		throw new Error("Unable to create Pass: object model has no content");
	}

	/* Certificates checks */

	const { certificates } = await Promise.all([
		readCertificatesFromOptions(options.certificates)
	]);

	// Controllo se il model è un oggetto o una stringa
	// Se è un oggetto passo avanti
	// Se è una stringa controllo se è un path. Se è un path
	// faccio readdir
	// altrimenti throw

	// Creare una funzione che possa controllare ed estrarre i certificati
	// Creare una funzione che possa controllare ed estrarre i file
	// Entrambe devono ritornare Promise, così faccio await Promise.all

	return new Pass();
}

/**
 * Reads certificate contents, if the passed content is a path,
 * and parses them as a PEM.
 * @param options
 */

interface FinalCertificates {
	wwdr: forge.pki.Certificate;
	signerCert: forge.pki.Certificate;
	signerKey: forge.pki.PrivateKey;
}

async function readCertificatesFromOptions(options: Certificates): Promise<FinalCertificates> {
	if (!isValid(options, "certificatesSchema")) {
		throw new Error("Unable to create Pass: certificates schema validation failed.");
	}

	// if the signerKey is an object, we want to get
	// all the real contents and don't care of passphrase
	const flattenedDocs = Object.assign({}, options, {
		signerKey: (
			typeof options.signerKey === "string"
			? options.signerKey
			: options.signerKey.keyFile
		)
	});

	// We read the contents
	const rawContentsPromises = Object.keys(flattenedDocs)
		.map(content => {
			if (!!path.parse(content).ext) {
				// The content is a path to the document
				return readFile(path.resolve(content), { encoding: "utf8"});
			} else {
				// Content is the real document content
				return Promise.resolve(content);
			}
		});

	try {
		const parsedContents = await Promise.all(rawContentsPromises);
		const pemParsedContents = parsedContents.map((file, index) => {
			const certName = Object.keys(options)[index];
			const pem = parsePEM(
				certName,
				file,
				typeof options.signerKey === "object"
					? options.signerKey.passphrase
					: undefined
			);

			if (!pem) {
				throw new Error(formatMessage("INVALID_CERTS", certName));
			}

			return { [certName]: pem };
		});

		return Object.assign({}, ...pemParsedContents);
	} catch (err) {
		if (!err.path) {
			throw err;
		}

		throw new Error(formatMessage("INVALID_CERT_PATH", path.parse(err.path).base));
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

module.exports = { createPass };
