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

	public push(...items: T[]): number {
		const validItems = this.__registerWithValidation(...items);
		return super.push(...validItems);
	}

	public pop(): T | undefined {
		return this.__unregisterItems<T>(() => super.pop());
	}

	public splice(start: number, deleteCount: number, ...items: T[]): T[] {
		// Perfoming frozen check, validation and getting valid items
		const validItems = this.__registerWithValidation(...items);

		for (let i = start; i < start + deleteCount; i++) {
			this[sharedKeysPoolSymbol].delete(this[i].key);
		}

		return super.splice(start, deleteCount, ...validItems);
	}

	public shift() {
		return this.__unregisterItems<T>(() => super.shift());
	}

	public unshift(...items: T[]) {
		const validItems = this.__registerWithValidation(...items);
		return super.unshift(...validItems);
	}

	private __registerWithValidation(...items: T[]) {
		Utils.assertUnfrozen(this[passInstanceSymbol]);

		let validItems: T[] = [];

		for (const field of items) {
			if (!field) {
				console.warn(Messages.format(Messages.FIELDS.INVALID, field));
				continue;
			}

			try {
				if (this[sharedKeysPoolSymbol].has(field.key)) {
					throw new TypeError(
						Messages.format(
							Messages.FIELDS.REPEATED_KEY,
							field.key,
						),
					);
				}

				const validatedContent = Schemas.validate(
					this[fieldSchemaSymbol],
					field,
				);

				this[sharedKeysPoolSymbol].add(validatedContent.key);
				validItems.push(validatedContent);
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

	private __unregisterItems<T extends PassFieldContent>(
		removeFn: Function,
	): T {
		Utils.assertUnfrozen(this[passInstanceSymbol]);

		const element: T = removeFn();
		this[sharedKeysPoolSymbol].delete(element.key);

		return element;
	}
}
