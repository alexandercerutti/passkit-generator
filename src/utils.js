const moment = require("moment");
const { EOL } = require("os");

/**
 * Checks if an rgb value is compliant with CSS-like syntax
 *
 * @function isValidRGB
 * @params {String} value - string to analyze
 * @returns {Boolean} True if valid rgb, false otherwise
 */

function isValidRGB(value) {
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
 * @params {String} date - The date to be parsed
 * @params {String} [format] - a custom format
 * @returns {String|undefined} The parsed string if the parameter is valid,
 * 	 undefined otherwise
 */

function dateToW3CString(date, format) {
	if (typeof date !== "string") {
		return "";
	}

	const parsedDate = moment(date.replace(/\//g, "-"), format || ["MM-DD-YYYY hh:mm:ss", "DD-MM-YYYY hh:mm:ss"]).format();

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

function removeHidden(from) {
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

function generateStringFile(lang) {
	if (!Object.keys(lang).length) {
		return Buffer.from("", "utf8");
	}

	// Pass.strings format is the following one for each row:
	// "key" = "value";

	const strings = Object.keys(lang)
		.map(key => `"${key}" = "${lang[key].replace(/"/g, /\\"/)}";`);

	return Buffer.from(strings.join(EOL), "utf8");
}

/**
 * Creates a new object with custom length property
 * @param {number} value - the length
 * @param {Array<Object<string, any>>} source - the main sources of properties
 */

function assignLength(length, ...sources) {
	return Object.assign({ length }, ...sources);
}

module.exports = {
	assignLength,
	generateStringFile,
	removeHidden,
	dateToW3CString,
	isValidRGB
};
