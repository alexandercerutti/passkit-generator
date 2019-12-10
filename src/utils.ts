import moment from "moment";
import { EOL } from "os";
import { PartitionedBundle, BundleUnit } from "./schema";
import { sep } from "path";

/**
 * Checks if an rgb value is compliant with CSS-like syntax
 *
 * @function isValidRGB
 * @params {String} value - string to analyze
 * @returns {Boolean} True if valid rgb, false otherwise
 */

export function isValidRGB(value: string): boolean {
	if (!value || typeof value !== "string") {
		return false;
	}

	const rgb = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/);

	if (!rgb) {
		return false;
	}

	return rgb.slice(1, 4).every(v => Math.abs(Number(v)) <= 255);
}

/**
 * Converts a date to W3C Standard format
 *
 * @function dateToW3Cstring
 * @params date - The date to be parsed
 * @returns - The parsed string if the parameter is valid,
 * 	 undefined otherwise
 */

export function dateToW3CString(date: Date) {
	if (!(date instanceof Date)) {
		return "";
	}

	const parsedDate = moment(date).format();

	if (parsedDate === "Invalid date") {
		return undefined;
	}

	return parsedDate;
}

/**
 * Apply a filter to arg0 to remove hidden files names (starting with dot)
 *
 * @function removeHidden
 * @params {String[]} from - list of file names
 * @return {String[]}
 */

export function removeHidden(from: Array<string>): Array<string> {
	return from.filter(e => e.charAt(0) !== ".");
}

/**
 * Creates a buffer of translations in Apple .strings format
 *
 * @function generateStringFile
 * @params {Object} lang - structure containing related to ISO 3166 alpha-2 code for the language
 * @returns {Buffer} Buffer to be written in pass.strings for language in lang
 * @see https://apple.co/2M9LWVu - String Resources
 */

export function generateStringFile(lang: { [index: string]: string }): Buffer {
	if (!Object.keys(lang).length) {
		return Buffer.from("", "utf8");
	}

	// Pass.strings format is the following one for each row:
	// "key" = "value";

	const strings = Object.keys(lang)
		.map(key => `"${key}" = "${lang[key].replace(/"/g, '\"')}";`);

	return Buffer.from(strings.join(EOL), "utf8");
}

/**
 * Applies a partition to split one bundle
 * to two
 * @param origin
 */

export function splitBufferBundle(origin: Object): [PartitionedBundle["l10nBundle"], PartitionedBundle["bundle"]] {
	return Object.keys(origin).reduce(([ l10n, bundle ], current) => {
		if (!current.includes(".lproj")) {
			return [ l10n, { ...bundle, [current]: origin[current] }];
		}

		const pathComponents = current.split(sep);
		const lang = pathComponents[0];
		const file = pathComponents.slice(1).join("/");

		(l10n[lang] || (l10n[lang] = {}))[file] = origin[current];

		return [ l10n, bundle ];
	}, [{},{}]);
}

type StringSearchMode = "includes" | "startsWith" | "endsWith";

export function getAllFilesWithName(name: string, source: string[], mode: StringSearchMode = "includes", forceLowerCase: boolean = false): string[] {
	return source.filter(file => (forceLowerCase && file.toLowerCase() || file)[mode](name));
}

export function hasFilesWithName(name: string, source: string[], mode: StringSearchMode = "includes", forceLowerCase: boolean = false): boolean {
	return source.some(file => (forceLowerCase && file.toLowerCase() || file)[mode](name));
}

export function deletePersonalization(source: BundleUnit, logosNames: string[] = []): void {
	[...logosNames, "personalization.json"]
		.forEach(file => delete source[file]);
}
