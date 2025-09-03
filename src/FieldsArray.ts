import type PKPass from "./PKPass.js";
import * as Schemas from "./schemas/index.js";
import * as Utils from "./utils.js";
import * as Messages from "./messages.js";

/**
 * Class to represent lower-level keys pass fields
 * @see https://apple.co/2wkUBdh
 */

const passInstanceSymbol = Symbol("passInstance");
const sharedKeysPoolSymbol = Symbol("keysPool");
const fieldSchemaSymbol = Symbol("fieldSchema");

export default class FieldsArray extends Array<Schemas.PassFieldContent> {
	private [passInstanceSymbol]: InstanceType<typeof PKPass>;
	private [sharedKeysPoolSymbol]: Set<string>;

	constructor(
		passInstance: InstanceType<typeof PKPass>,
		keysPool: Set<string>,
		fieldSchema:
			| typeof Schemas.PassFieldContent
			| typeof Schemas.PassFieldContentWithRow,
		...args: Schemas.PassFieldContent[]
	) {
		super(...args);
		this[fieldSchemaSymbol] = fieldSchema;
		this[passInstanceSymbol] = passInstance;
		this[sharedKeysPoolSymbol] = keysPool;
	}

	push(...items: Schemas.PassFieldContent[]): number {
		const validItems = registerWithValidation(this, ...items);
		return super.push(...validItems);
	}

	pop(): Schemas.PassFieldContent {
		return unregisterItems(this, () => super.pop());
	}

	splice(
		start: number,
		deleteCount: number,
		...items: Schemas.PassFieldContent[]
	): Schemas.PassFieldContent[] {
		// Perfoming frozen check, validation and getting valid items
		const validItems = registerWithValidation(this, ...items);

		for (let i = start; i < start + deleteCount; i++) {
			this[sharedKeysPoolSymbol].delete(this[i].key);
		}

		return super.splice(start, deleteCount, ...validItems);
	}

	shift() {
		return unregisterItems(this, () => super.shift());
	}

	unshift(...items: Schemas.PassFieldContent[]) {
		const validItems = registerWithValidation(this, ...items);
		return super.unshift(...validItems);
	}
}

function registerWithValidation(
	instance: InstanceType<typeof FieldsArray>,
	...items: Schemas.PassFieldContent[]
) {
	Utils.assertUnfrozen(instance[passInstanceSymbol]);

	let validItems: Schemas.PassFieldContent[] = [];

	for (const field of items) {
		if (!field) {
			console.warn(Messages.format(Messages.FIELDS.INVALID, field));
			continue;
		}

		try {
			Schemas.assertValidity(
				instance[fieldSchemaSymbol],
				field,
				Messages.FIELDS.INVALID,
			);

			if (instance[sharedKeysPoolSymbol].has(field.key)) {
				throw new TypeError(
					Messages.format(Messages.FIELDS.REPEATED_KEY, field.key),
				);
			}

			instance[sharedKeysPoolSymbol].add(field.key);
			validItems.push(field);
		} catch (err) {
			if (err instanceof Error) {
				console.warn(err.message ? err.message : err);
			} else {
				console.warn(err);
			}
		}
	}

	return validItems;
}

function unregisterItems(
	instance: InstanceType<typeof FieldsArray>,
	removeFn: Function,
) {
	Utils.assertUnfrozen(instance[passInstanceSymbol]);

	const element: Schemas.PassFieldContent = removeFn();
	instance[sharedKeysPoolSymbol].delete(element.key);
	return element;
}
