import {
	assertValidity,
	PassFieldContent,
	PassFields,
	PassFieldContentWithRow,
	PassTypesProps,
	TransitType,
} from "./schemas/index.js";
import * as Messages from "./messages.js";

const headerFieldsSymbol = Symbol("headerFields");
const frozenSymbol = Symbol("frozen");
const primaryFieldsSymbol = Symbol("primaryFields");
const secondaryFieldsSymbol = Symbol("secondaryFields");
const auxiliaryFieldsSymbol = Symbol("auxiliaryFields");
const backFieldsSymbol = Symbol("backFields");
const additionalInfoFieldsSymbol = Symbol("additionalInfoFields");
const footerFieldsSymbol = Symbol("footerFields");
const transitTypeSymbol = Symbol("transitType");

const keyPoolSymbol = Symbol("sharedKey");

export class PassType<Type extends PassTypesProps> {
	public readonly type: Type;
	private [keyPoolSymbol]: Set<string> = new Set();
	private [frozenSymbol]: boolean = false;

	private [headerFieldsSymbol]: PassFieldContent[];
	private [primaryFieldsSymbol]: PassFieldContent[];
	private [secondaryFieldsSymbol]: PassFieldContent[];
	private [auxiliaryFieldsSymbol]: PassFieldContent[];
	private [backFieldsSymbol]: PassFieldContent[];
	private [additionalInfoFieldsSymbol]: PassFieldContent[];
	private [footerFieldsSymbol]: PassFieldContent[];
	private [transitTypeSymbol]: TransitType | undefined = undefined;

	public constructor(type: Type) {
		Object.defineProperty(this, "type", {
			value: type,
			writable: false,
			enumerable: true,
			configurable: false,
		});

		const isFrozen = () => this[frozenSymbol];

		this[headerFieldsSymbol] = createValidatedArray(
			this[keyPoolSymbol],
			PassFieldContent,
			isFrozen,
		);

		this[primaryFieldsSymbol] = createValidatedArray(
			this[keyPoolSymbol],
			PassFieldContent,
			isFrozen,
		);

		this[secondaryFieldsSymbol] = createValidatedArray(
			this[keyPoolSymbol],
			PassFieldContent,
			isFrozen,
		);

		this[auxiliaryFieldsSymbol] = createValidatedArray(
			this[keyPoolSymbol],
			type === "eventTicket" ? PassFieldContentWithRow : PassFieldContent,
			isFrozen,
		);

		this[backFieldsSymbol] = createValidatedArray(
			this[keyPoolSymbol],
			PassFieldContent,
			isFrozen,
		);

		this[additionalInfoFieldsSymbol] = createValidatedArray(
			this[keyPoolSymbol],
			PassFieldContent,
			isFrozen,
		);

		this[footerFieldsSymbol] = createValidatedArray(
			this[keyPoolSymbol],
			PassFieldContent,
			isFrozen,
		);
	}

	/**
	 * Serializes this pass type into the shape Apple expects to find
	 * under the pass style key of a pass.json.
	 *
	 * Only what the type actually owns gets emitted: fields arrays
	 * exist for every type, so `footerFields` would otherwise travel
	 * inside a coupon. `type` is left out on purpose too: it is the
	 * key this dictionary gets assigned to, not part of its content.
	 */

	public toJSON(): Partial<Record<PassTypesProps, PassFields>> {
		const passFields: PassFields = {
			headerFields: [...this.headerFields],
			primaryFields: [...this.primaryFields],
			secondaryFields: [...this.secondaryFields],
			auxiliaryFields: [...this.auxiliaryFields],
			backFields: [...this.backFields],
		};

		if (this.type === "boardingPass" && this.transitType) {
			passFields.transitType = this.transitType;
		}

		if (this.type === "eventTicket") {
			passFields.additionalInfoFields = [...this.additionalInfoFields];
		}

		if (this.type === "posterGeneric") {
			passFields.footerFields = [...this.footerFields];
		}

		return {
			[this.type]: passFields,
		};
	}

	public freeze(): void {
		this[frozenSymbol] = true;
	}

	// ******************//
	// *** ACCESSORS *** //
	// ******************//
	//region Accessors

	public get headerFields(): PassFieldContent[] {
		return this[headerFieldsSymbol];
	}

	public get primaryFields(): PassFieldContent[] {
		return this[primaryFieldsSymbol];
	}

	public get secondaryFields(): PassFieldContent[] {
		return this[secondaryFieldsSymbol];
	}

	public get auxiliaryFields(): PassFieldContent[] {
		return this[auxiliaryFieldsSymbol];
	}

	public get backFields(): PassFieldContent[] {
		return this[backFieldsSymbol];
	}

	public get additionalInfoFields(): PassFieldContent[] {
		return this[additionalInfoFieldsSymbol];
	}

	public get footerFields(): PassFieldContent[] {
		return this[footerFieldsSymbol];
	}

	/**
	 * Allows setting the transitType for a boardingPass.
	 * Throws an error if the pass type is not boardingPass.
	 */
	public set transitType(transitType: TransitType) {
		if (this[frozenSymbol]) {
			throw new Error(Messages.BUNDLE.CLOSED);
		}

		if (this.type !== "boardingPass") {
			throw new TypeError(Messages.TRANSIT_TYPE.UNEXPECTED_PASS_TYPE);
		}

		assertValidity(TransitType, transitType, Messages.TRANSIT_TYPE.INVALID);

		this[transitTypeSymbol] = transitType;
	}

	public get transitType(): TransitType | undefined {
		return this[transitTypeSymbol];
	}
}

function createValidatedArray(
	keysPool: Set<string>,
	schema: typeof PassFieldContent | typeof PassFieldContentWithRow,
	isFrozen: () => boolean,
): PassFieldContent[] {
	return new Proxy<PassFieldContent[]>([], {
		set(target, property, value) {
			if (isFrozen()) {
				throw new Error(Messages.BUNDLE.CLOSED);
			}

			if (property === "length") {
				const droppedItems = target.slice(Number(value));
				const result = Reflect.set(target, property, value);

				for (const field of droppedItems) {
					// When using "pop" or "shift", the items are already dropped (they might be empty slots)
					if (field) {
						keysPool.delete(field.key);
					}
				}

				return result;
			}

			const index = toArrayIndex(property);

			if (index === undefined) {
				return false;
			}

			const previous: PassFieldContent | undefined = target[index];

			if (!value) {
				throw new TypeError(
					Messages.format(Messages.FIELDS.INVALID, value),
				);
			}

			/**
			 * `sort`, `reverse`, `unshift` and `splice` relocate
			 * fields this array already owns.
			 */

			if (!target.includes(value)) {
				assertValidity(schema, value, Messages.FIELDS.INVALID);

				if (keysPool.has(value.key)) {
					throw new TypeError(
						Messages.format(
							Messages.FIELDS.REPEATED_KEY,
							value.key,
						),
					);
				}

				keysPool.add(value.key);
			}

			const result = Reflect.set(target, property, value);

			if (
				previous &&
				previous.key !== value.key &&
				!target.includes(previous)
			) {
				keysPool.delete(previous.key);
			}

			return result;
		},

		deleteProperty(target, property) {
			if (isFrozen()) {
				throw new Error(Messages.BUNDLE.CLOSED);
			}

			const index = toArrayIndex(property);

			if (index === undefined) {
				return Reflect.deleteProperty(target, property);
			}

			const removed: PassFieldContent | undefined = target[index];
			const result = Reflect.deleteProperty(target, property);

			if (removed && !target.includes(removed)) {
				keysPool.delete(removed.key);
			}

			return result;
		},
	});
}

/**
 * Verifies if the provided property is a valid array index and returns it as a number.
 *
 * @param property
 * @returns
 */
function toArrayIndex(property: string | symbol): number | undefined {
	if (typeof property !== "string") {
		return undefined;
	}

	const index = Number(property);

	if (!Number.isInteger(index) || index < 0 || String(index) !== property) {
		return undefined;
	}

	return index;
}
