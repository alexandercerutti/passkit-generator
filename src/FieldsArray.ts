import type PKPass from "./PKPass";
import * as Schemas from "./schemas";
import * as Utils from "./utils";
import * as Messages from "./messages";

/**
 * Class to represent lower-level keys pass fields
 * @see https://apple.co/2wkUBdh
 */

const passInstanceSymbol = Symbol("passInstance");
const sharedKeysPoolSymbol = Symbol("keysPool");

export default class FieldsArray extends Array<Schemas.Field> {
	private [passInstanceSymbol]: InstanceType<typeof PKPass>;
	private [sharedKeysPoolSymbol]: Set<string>;

	constructor(
		passInstance: InstanceType<typeof PKPass>,
		keysPool: Set<string>,
		...args: Schemas.Field[]
	) {
		super(...args);
		this[passInstanceSymbol] = passInstance;
		this[sharedKeysPoolSymbol] = keysPool;
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

				if (this[sharedKeysPoolSymbol].has(current.key)) {
					console.warn(
						Messages.format(
							Messages.FIELDS.REPEATED_KEY,
							current.key,
						),
					);
					return acc;
				}

				this[sharedKeysPoolSymbol].add(current.key);
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
		this[sharedKeysPoolSymbol].delete(element.key);
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
			this[sharedKeysPoolSymbol].delete(item.key),
		);

		let validItems = items ?? [];

		if (validItems.length) {
			validItems = Schemas.filterValid(Schemas.Field, items);

			for (let i = 0; i < validItems.length; i++) {
				this[sharedKeysPoolSymbol].add(validItems[i].key);
			}
		}

		return super.splice(start, deleteCount, ...validItems);
	}

	get length(): number {
		return this.length;
	}
}
