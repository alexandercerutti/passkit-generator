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

	push(...items: Schemas.Field[]): number {
		const validItems = registerWithValidation(this, ...items);
		return super.push(...validItems);
	}

	pop(): Schemas.Field {
		return unregisterItems(this, () => super.pop());
	}

	splice(
		start: number,
		deleteCount: number,
		...items: Schemas.Field[]
	): Schemas.Field[] {
		Utils.assertUnfrozen(this[passInstanceSymbol]);

		for (let i = start; i < start + deleteCount; i++) {
			this[sharedKeysPoolSymbol].delete(this[i].key);
		}

		const validItems = registerWithValidation(this, ...items);
		return super.splice(start, deleteCount, ...validItems);
	}

	shift() {
		return unregisterItems(this, () => super.shift());
	}

	unshift(...items: Schemas.Field[]) {
		const validItems = registerWithValidation(this, ...items);
		return super.unshift(...validItems);
	}
}

function registerWithValidation(
	instance: InstanceType<typeof FieldsArray>,
	...items: Schemas.Field[]
) {
	Utils.assertUnfrozen(instance[passInstanceSymbol]);

	let validItems: Schemas.Field[] = [];

	for (let i = items.length, field: Schemas.Field; (field = items[--i]); ) {
		try {
			Schemas.assertValidity(
				Schemas.Field,
				field,
				Messages.FIELDS.INVALID,
			);

			if (instance[sharedKeysPoolSymbol].has(field.key)) {
				throw Messages.format(Messages.FIELDS.REPEATED_KEY, field.key);
			}

			instance[sharedKeysPoolSymbol].add(field.key);
			validItems.push(field);
		} catch (err) {
			console.warn(err);
		}
	}

	return validItems;
}

function unregisterItems(
	instance: InstanceType<typeof FieldsArray>,
	removeFn: Function,
) {
	Utils.assertUnfrozen(instance[passInstanceSymbol]);

	const element: Schemas.Field = removeFn();
	instance[sharedKeysPoolSymbol].delete(element.key);
	return element;
}
