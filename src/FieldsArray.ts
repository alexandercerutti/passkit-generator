import PKPass from "./PKPass";
import { fieldKeysPoolSymbol } from "./PKPass";
import * as Schemas from "./schemas";
import * as Utils from "./utils";
import formatMessage, * as Messages from "./messages";

/**
 * Class to represent lower-level keys pass fields
 * @see https://apple.co/2wkUBdh
 */

const passInstanceSymbol = Symbol("passInstance");

export default class FieldsArray extends Array<Schemas.Field> {
	private [passInstanceSymbol]: InstanceType<typeof PKPass>;

	constructor(
		passInstance: InstanceType<typeof PKPass>,
		...args: Schemas.Field[]
	) {
		super(...args);
		this[passInstanceSymbol] = passInstance;
	}

	/**
	 * Like `Array.prototype.push` but will alter
	 * also uniqueKeys set.
	 */

	push(...fieldsData: Schemas.Field[]): number {
		Utils.assertUnfrozen(this[passInstanceSymbol]);

		const validFields = fieldsData.reduce(
			(acc: Schemas.Field[], current: Schemas.Field) => {
				try {
					Schemas.assertValidity(
						Schemas.Field,
						current,
						Messages.FIELDS.INVALID,
					);
				} catch (err) {
					console.warn(err);
					return acc;
				}

				const pool = this[passInstanceSymbol][fieldKeysPoolSymbol];

				if (pool.has(current.key)) {
					console.warn(
						formatMessage(
							Messages.FIELDS.REPEATED_KEY,
							current.key,
						),
					);
					return acc;
				}

				pool.add(current.key);
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
		Utils.assertUnfrozen(this[passInstanceSymbol]);

		const element: Schemas.Field = super.pop();
		this[passInstanceSymbol][fieldKeysPoolSymbol].delete(element.key);
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
		Utils.assertUnfrozen(this[passInstanceSymbol]);

		const removeList = this.slice(start, deleteCount + start);
		removeList.forEach((item) =>
			this[passInstanceSymbol][fieldKeysPoolSymbol].delete(item.key),
		);

		return super.splice(start, deleteCount, ...items);
	}

	get length(): number {
		return this.length;
	}
}
