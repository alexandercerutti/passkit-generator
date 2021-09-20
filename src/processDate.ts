import { dateToW3CString } from "./utils";
import formatMessage, { ERROR, DEBUG } from "./messages";

export function processDate(key: string, date: Date): string | null {
	if (!(date instanceof Date)) {
		return null;
	}

	const dateParse = dateToW3CString(date);

	if (!dateParse) {
		console.warn(formatMessage(DEBUG.DATE_FORMAT_UNMATCH, key));
		return null;
	}

	return dateParse;
}
