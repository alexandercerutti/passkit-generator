import * as Schemas from "./schemas";
import debug from "debug";

const fieldsDebug = debug("passkit:fields");

/**
 * Class to represent lower-level keys pass fields
 * @see https://apple.co/2wkUBdh
 */

const poolSymbol = Symbol("pool");

export default class FieldsArray extends Array<Schemas.Field> {
	private [poolSymbol]: Set<string>;

	constructor(pool: Set<string>, ...args: Schemas.Field[]) {
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
				try {
					Schemas.assertValidity(Schemas.Field, current);
				} catch (err) {
					console.warn(`Cannot add field: ${err}`);
					return acc;
				}

				if (this[poolSymbol].has(current.key)) {
					console.warn(
						`Cannot add field with key '${current.key}': another field already owns this key. Ignored.`,
					);
					return acc;
				}

				this[poolSymbol].add(current.key);
				return [...acc, current];
			},
			[],
		);

		return super.push(...validFields);
	}

	/**
	 * Like `Array.prototype.pop`, but will alter
	 * also uniqueKeys set
	 */

	pop(): Schemas.Field {
		const element: Schemas.Field = super.pop();
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

		return super.splice(start, deleteCount, ...items);
	}

	get length(): number {
		return this.length;
	}
}
