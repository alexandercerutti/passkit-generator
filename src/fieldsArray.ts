import * as Schemas from "./schemas";
import debug from "debug";

const fieldsDebug = debug("passkit:fields");

/**
 * Class to represent lower-level keys pass fields
 * @see https://apple.co/2wkUBdh
 */

const poolSymbol = Symbol("pool");

export default class FieldsArray extends Array {
	private [poolSymbol]: Set<string>;

	constructor(pool: Set<string>, ...args: any[]) {
		super(...args);
		this[poolSymbol] = pool;
	}

	/**
	 * Like `Array.prototype.push` but will alter
	 * also uniqueKeys set.
	 */

	push(...fieldsData: Schemas.Field[]): number {
		const validFields = fieldsData.reduce(
			(acc: Schemas.Field[], current: Schemas.Field) => {
				if (
					!(typeof current === "object") ||
					!Schemas.isValid(current, Schemas.Field)
				) {
					return acc;
				}

				if (this[poolSymbol].has(current.key)) {
					fieldsDebug(
						`Field with key "${current.key}" discarded: fields must be unique in pass scope.`,
					);
				} else {
					this[poolSymbol].add(current.key);
					acc.push(current);
				}

				return acc;
			},
			[],
		);

		return Array.prototype.push.call(this, ...validFields);
	}

	/**
	 * Like `Array.prototype.pop`, but will alter
	 * also uniqueKeys set
	 */

	pop(): Schemas.Field {
		const element: Schemas.Field = Array.prototype.pop.call(this);
		this[poolSymbol].delete(element.key);
		return element;
	}

	/**
	 * Like `Array.prototype.splice` but will alter
	 * also uniqueKeys set
	 */

	splice(
		start: number,
		deleteCount: number,
		...items: Schemas.Field[]
	): Schemas.Field[] {
		const removeList = this.slice(start, deleteCount + start);
		removeList.forEach((item) => this[poolSymbol].delete(item.key));

		return Array.prototype.splice.call(this, start, deleteCount, items);
	}

	get length(): number {
		return this.length;
	}
}
