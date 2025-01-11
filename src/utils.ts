import * as Messages from "./messages.js";
import type Bundle from "./Bundle.js";

/**
 * Converts a date to W3C / UTC string
 * @param date
 * @returns
 */

export function processDate(date: Date): string | undefined {
	if (!(date instanceof Date) || Number.isNaN(Number(date))) {
		throw "Invalid date";
	}

	/**
	 * @see https://www.w3.org/TR/NOTE-datetime
	 */

	return date.toISOString();
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

/**
 * Clones recursively an object and all of its properties
 *
 * @param object
 * @returns
 */

export function cloneRecursive<T extends Object>(object: T) {
	const objectCopy = {} as Record<keyof T, any>;
	const objectEntries = Object.entries(object) as [keyof T, T[keyof T]][];

	for (let i = 0; i < objectEntries.length; i++) {
		const [key, value] = objectEntries[i];

		if (value && typeof value === "object") {
			if (Array.isArray(value)) {
				objectCopy[key] = value.slice();

				for (let j = 0; j < value.length; j++) {
					objectCopy[key][j] = cloneRecursive(value[j]);
				}
			} else {
				objectCopy[key] = cloneRecursive(value);
			}
		} else {
			objectCopy[key] = value;
		}
	}

	return objectCopy;
}

export function assertUnfrozen(
	instance: InstanceType<typeof Bundle>,
): asserts instance is Bundle & { isFrozen: false } {
	if (instance.isFrozen) {
		throw new Error(Messages.BUNDLE.CLOSED);
	}
}
