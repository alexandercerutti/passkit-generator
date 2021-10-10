import { EOL } from "os";
import type * as Schemas from "./schemas";
import { sep } from "path";

/**
 * Checks if an rgb value is compliant with CSS-like syntax
 *
 * @function isValidRGB
 * @params {String} value - string to analyze
 * @returns {Boolean} True if valid rgb, false otherwise
 */

export function isValidRGB(value?: string): boolean {
	if (!value || typeof value !== "string") {
		return false;
	}

	const rgb = value.match(
		/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/,
	);

	if (!rgb) {
		return false;
	}

	return rgb.slice(1, 4).every((v) => Math.abs(Number(v)) <= 255);
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

	// if it is NaN, it is "Invalid Date"
	if (isNaN(Number(date))) {
		return undefined;
	}

	const paddedMonth = padMeTwo(date.getMonth() + 1);
	const paddedDay = padMeTwo(date.getDate());
	const paddedHour = padMeTwo(date.getHours());
	const paddedMinutes = padMeTwo(date.getMinutes());
	const paddedSeconds = padMeTwo(date.getSeconds());

	/**
	 * Date.prototype.getTimezoneOffset returns the timezone UTC offset in
	 * minutes of the local machine.
	 *
	 * That value should then be used to calculate the effective timezone as
	 * string, but still that would be related to the machine and not to the
	 * specified date.
	 *
	 * For this reason we are completing date with "Z" TimeZoneDesignator (TZD)
	 * to say it to use local timezone.
	 *
	 * In the future we might think to integrate another parameter to represent
	 * a custom timezone.
	 *
	 * @see https://www.w3.org/TR/NOTE-datetime
	 */

	return `${date.getFullYear()}-${paddedMonth}-${paddedDay}T${paddedHour}:${paddedMinutes}:${paddedSeconds}Z`;
}

function padMeTwo(original: string | number) {
	return String(original).padStart(2, "0");
}

/**
 * Apply a filter to arg0 to remove hidden files names (starting with dot)
 *
 * @function removeHidden
 * @params {String[]} from - list of file names
 * @return {String[]}
 */

export function removeHidden(from: Array<string>): Array<string> {
	return from.filter((e) => e.charAt(0) !== ".");
}
