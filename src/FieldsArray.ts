import type PKPass from "./PKPass.js";
import * as Schemas from "./schemas/index.js";
import * as Utils from "./utils.js";
import * as Messages from "./messages.js";
import type { ZodType } from "zod";

/**
 * Class to represent lower-level keys pass fields
 * @see https://apple.co/2wkUBdh
 */

const passInstanceSymbol = Symbol("passInstance");
const sharedKeysPoolSymbol = Symbol("keysPool");
const fieldSchemaSymbol = Symbol("fieldSchema");

type PassFieldContent =
	| Schemas.PassFieldContent
	| Schemas.PassFieldContentWithRow;

export default class FieldsArray<
	T extends PassFieldContent = PassFieldContent,
> extends Array<T> {
	private [passInstanceSymbol]: InstanceType<typeof PKPass>;
	private [sharedKeysPoolSymbol]: Set<string>;
	private [fieldSchemaSymbol]: ZodType<T>;

	constructor(
		passInstance: InstanceType<typeof PKPass>,
		keysPool: Set<string>,
		fieldSchema: ZodType<T>,
	) {
		super();
		this[fieldSchemaSymbol] = fieldSchema;
		this[passInstanceSymbol] = passInstance;
		this[sharedKeysPoolSymbol] = keysPool;
	}

	push(...items: T[]): number {
		const validItems = registerWithValidation(this, ...items);
		return super.push(...validItems);
	}

	pop(): T | undefined {
		return unregisterItems<T>(this, () => super.pop());
	}

	splice(start: number, deleteCount: number, ...items: T[]): T[] {
		// Perfoming frozen check, validation and getting valid items
		const validItems = registerWithValidation(this, ...items);

		for (let i = start; i < start + deleteCount; i++) {
			this[sharedKeysPoolSymbol].delete(this[i].key);
		}

		return super.splice(start, deleteCount, ...validItems);
	}

	shift() {
		return unregisterItems<T>(this, () => super.shift());
	}

	unshift(...items: T[]) {
		const validItems = registerWithValidation(this, ...items);
		return super.unshift(...validItems);
	}
}

function registerWithValidation<T extends PassFieldContent>(
	instance: InstanceType<typeof FieldsArray>,
	...items: T[]
) {
	Utils.assertUnfrozen(instance[passInstanceSymbol]);

	let validItems: T[] = [];

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

function unregisterItems<T extends PassFieldContent>(
	instance: InstanceType<typeof FieldsArray>,
	removeFn: Function,
): T {
	Utils.assertUnfrozen(instance[passInstanceSymbol]);

	const element: T = removeFn();
	instance[sharedKeysPoolSymbol].delete(element.key);
	return element;
}
