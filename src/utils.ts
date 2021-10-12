/**
 * Acts as a wrapper for converting date to W3C string
 * @param date
 * @returns
 */

export function processDate(date: Date): string | null {
	if (!(date instanceof Date)) {
		throw "Invalid date";
	}

	const dateParse = dateToW3CString(date);

	if (!dateParse) {
		throw "Invalid date";
	}

	return dateParse;
}

/**
 * Converts a date to W3C Standard format
 *
 * @function dateToW3Cstring
 * @params date - The date to be parsed
 * @returns - The parsed string if the parameter is valid,
 * 	 undefined otherwise
 */

function dateToW3CString(date: Date) {
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
 * Removes hidden files from a list (those starting with dot)
 *
 * @params from - list of file names
 * @return
 */

export function removeHidden(from: Array<string>): Array<string> {
	return from.filter((e) => e.charAt(0) !== ".");
}
