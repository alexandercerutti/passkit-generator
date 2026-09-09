import { beforeEach, describe, expect, it } from "@jest/globals";
import { PassType } from "../lib/esm/PassType.js";

/**
 * Fields are compared by key only: their content is irrelevant
 * to what this suite verifies.
 */

function field(key) {
	return {
		key,
		value: `value for ${key}`,
	};
}

/**
 * There is no public access to the keys pool, so it gets probed
 * through the behaviour it exists for: claiming a reserved key
 * throws, whichever fields array of the pass type tries it.
 */

function expectKeyReserved(passType, key) {
	expect(() => passType.backFields.push(field(key))).toThrow();
}

function expectKeyReleased(passType, key) {
	expect(() => passType.backFields.push(field(key))).not.toThrow();

	/**
	 * The probe itself claims the key: giving it back keeps the
	 * assertions of a same test independent from each other.
	 */

	passType.backFields.length = 0;
}

describe("PassType", () => {
	/**
	 * @type {PassType}
	 */
	let passType;

	beforeEach(() => {
		passType = new PassType("generic");
	});

	describe("type", () => {
		it("should expose the type it has been created with", () => {
			expect(new PassType("boardingPass").type).toBe("boardingPass");
		});

		it("should not allow the type to be reassigned", () => {
			expect(() => {
				passType.type = "coupon";
			}).toThrow();

			expect(passType.type).toBe("generic");
		});
	});

	describe("fields validation", () => {
		it("should accept a valid field", () => {
			passType.primaryFields.push(field("a"));

			expect(passType.primaryFields).toEqual([field("a")]);
		});

		it("should reject a field that does not match the schema", () => {
			expect(() =>
				passType.primaryFields.push({ value: "no key" }),
			).toThrow();

			expect(passType.primaryFields.length).toBe(0);
		});

		it("should reject a nullish field without leaking a native error", () => {
			expect(() => passType.primaryFields.push(null)).toThrow(TypeError);
			expect(() => passType.primaryFields.push(undefined)).toThrow(
				TypeError,
			);

			expect(passType.primaryFields.length).toBe(0);
		});

		it("should validate eventTicket auxiliaryFields against the row schema", () => {
			const eventTicket = new PassType("eventTicket");

			eventTicket.auxiliaryFields.push({ ...field("a"), row: 1 });

			expect(eventTicket.auxiliaryFields[0].row).toBe(1);
			expect(() =>
				eventTicket.auxiliaryFields.push({ ...field("b"), row: 5 }),
			).toThrow();
		});
	});

	describe("keys uniqueness", () => {
		it("should reject two fields owning the same key", () => {
			passType.primaryFields.push(field("a"));

			expect(() => passType.primaryFields.push(field("a"))).toThrow();
			expect(passType.primaryFields.length).toBe(1);
		});

		it("should share the keys pool across every fields array", () => {
			passType.primaryFields.push(field("a"));

			expect(() => passType.headerFields.push(field("a"))).toThrow();
		});

		it("should keep the keys pool of two pass types independent", () => {
			const generic = new PassType("generic");
			const posterGeneric = new PassType("posterGeneric");

			generic.primaryFields.push(field("a"));

			expect(() =>
				posterGeneric.primaryFields.push(field("a")),
			).not.toThrow();
		});
	});

	describe("array mutations", () => {
		beforeEach(() => {
			passType.primaryFields.push(field("a"), field("b"), field("c"));
		});

		it("should support push", () => {
			passType.primaryFields.push(field("d"));

			expect(passType.primaryFields.map((f) => f.key)).toEqual([
				"a",
				"b",
				"c",
				"d",
			]);
		});

		it("should support unshift", () => {
			passType.primaryFields.unshift(field("z"));

			expect(passType.primaryFields.map((f) => f.key)).toEqual([
				"z",
				"a",
				"b",
				"c",
			]);
		});

		it("should support pop and release the popped key", () => {
			expect(passType.primaryFields.pop()).toEqual(field("c"));
			expect(passType.primaryFields.map((f) => f.key)).toEqual([
				"a",
				"b",
			]);
			expectKeyReleased(passType, "c");
		});

		it("should support shift and release the shifted key", () => {
			expect(passType.primaryFields.shift()).toEqual(field("a"));
			expect(passType.primaryFields.map((f) => f.key)).toEqual([
				"b",
				"c",
			]);
			expectKeyReleased(passType, "a");
		});

		it("should support splice and release only the removed keys", () => {
			passType.primaryFields.splice(0, 1);

			expect(passType.primaryFields.map((f) => f.key)).toEqual([
				"b",
				"c",
			]);
			expectKeyReleased(passType, "a");
			expectKeyReserved(passType, "b");
			expectKeyReserved(passType, "c");
		});

		it("should release every key when truncated through length", () => {
			passType.primaryFields.length = 0;

			expect(passType.primaryFields.length).toBe(0);
			expectKeyReleased(passType, "a");
			expectKeyReleased(passType, "b");
			expectKeyReleased(passType, "c");
		});

		it("should release the key of a deleted index", () => {
			delete passType.primaryFields[0];

			expectKeyReleased(passType, "a");
		});

		it("should swap keys when an index gets overwritten", () => {
			passType.primaryFields[0] = field("z");

			expect(passType.primaryFields.map((f) => f.key)).toEqual([
				"z",
				"b",
				"c",
			]);
			expectKeyReleased(passType, "a");
			expectKeyReserved(passType, "z");
		});

		it("should reorder through sort without altering the keys pool", () => {
			passType.primaryFields.sort((first, second) =>
				second.key.localeCompare(first.key),
			);

			expect(passType.primaryFields.map((f) => f.key)).toEqual([
				"c",
				"b",
				"a",
			]);
			expectKeyReserved(passType, "a");
			expectKeyReserved(passType, "b");
			expectKeyReserved(passType, "c");
		});

		it("should reorder through reverse without altering the keys pool", () => {
			passType.primaryFields.reverse();

			expect(passType.primaryFields.map((f) => f.key)).toEqual([
				"c",
				"b",
				"a",
			]);
			expectKeyReserved(passType, "a");
			expectKeyReserved(passType, "b");
			expectKeyReserved(passType, "c");
		});
	});

	describe("fields arrays", () => {
		it("should not allow a fields array to be replaced", () => {
			expect(() => {
				passType.primaryFields = [field("a")];
			}).toThrow();
		});

		it("should reset through the array itself", () => {
			passType.primaryFields.push(field("a"));
			passType.primaryFields.length = 0;
			passType.primaryFields.push(field("b"));

			expect(passType.primaryFields.map((f) => f.key)).toEqual(["b"]);
			expectKeyReleased(passType, "a");
		});
	});

	describe("type exclusive fields", () => {
		it("should allow transitType on boardingPass only", () => {
			const boardingPass = new PassType("boardingPass");

			boardingPass.transitType = "PKTransitTypeAir";

			expect(boardingPass.transitType).toBe("PKTransitTypeAir");
			expect(() => {
				passType.transitType = "PKTransitTypeAir";
			}).toThrow();
		});

		it("should reject an unknown transitType", () => {
			const boardingPass = new PassType("boardingPass");

			expect(() => {
				boardingPass.transitType = "PKTransitTypeSpaceship";
			}).toThrow();
		});

		it("should expose every fields array, exclusive ones included", () => {
			expect(passType.footerFields).toEqual([]);
			expect(passType.additionalInfoFields).toEqual([]);
		});

		it("should leave transitType unset on types that cannot own it", () => {
			expect(passType.transitType).toBeUndefined();
		});
	});

	describe("serialization", () => {
		/**
		 * The dictionary carries its own pass style key, so that PKPass
		 * can merge every type of the pass into pass.json at once.
		 */

		it("should key the dictionary by the pass type", () => {
			expect(Object.keys(passType.toJSON())).toEqual(["generic"]);
		});

		it("should not repeat the type inside the dictionary", () => {
			expect(
				JSON.parse(JSON.stringify(passType)).generic,
			).not.toHaveProperty("type");
		});

		it("should serialize the fields every type owns", () => {
			passType.primaryFields.push(field("a"));

			expect(JSON.parse(JSON.stringify(passType))).toEqual({
				generic: {
					headerFields: [],
					primaryFields: [field("a")],
					secondaryFields: [],
					auxiliaryFields: [],
					backFields: [],
				},
			});
		});

		it("should not serialize exclusive fields of other types", () => {
			passType.footerFields.push(field("a"));
			passType.additionalInfoFields.push(field("b"));

			const { generic } = JSON.parse(JSON.stringify(passType));

			expect(generic).not.toHaveProperty("footerFields");
			expect(generic).not.toHaveProperty("additionalInfoFields");
		});

		it("should serialize footerFields on posterGeneric", () => {
			const posterGeneric = new PassType("posterGeneric");

			posterGeneric.footerFields.push(field("a"));

			expect(
				JSON.parse(JSON.stringify(posterGeneric)).posterGeneric
					.footerFields,
			).toEqual([field("a")]);
		});

		it("should serialize additionalInfoFields on eventTicket", () => {
			const eventTicket = new PassType("eventTicket");

			eventTicket.additionalInfoFields.push(field("a"));

			expect(
				JSON.parse(JSON.stringify(eventTicket)).eventTicket
					.additionalInfoFields,
			).toEqual([field("a")]);
		});

		it("should serialize transitType only once set", () => {
			const boardingPass = new PassType("boardingPass");

			expect(
				JSON.parse(JSON.stringify(boardingPass)).boardingPass,
			).not.toHaveProperty("transitType");

			boardingPass.transitType = "PKTransitTypeAir";

			expect(
				JSON.parse(JSON.stringify(boardingPass)).boardingPass
					.transitType,
			).toBe("PKTransitTypeAir");
		});

		it("should merge several types into a single pass.json", () => {
			const generic = new PassType("generic");
			const posterGeneric = new PassType("posterGeneric");

			generic.primaryFields.push(field("a"));
			posterGeneric.primaryFields.push(field("a"));

			const merged = Object.assign(
				{},
				generic.toJSON(),
				posterGeneric.toJSON(),
			);

			expect(Object.keys(merged)).toEqual(["generic", "posterGeneric"]);
		});

		it("should snapshot the fields instead of exposing the live arrays", () => {
			passType.primaryFields.push(field("a"));

			const serialized = passType.toJSON();
			passType.primaryFields.push(field("b"));

			expect(serialized.generic.primaryFields.map((f) => f.key)).toEqual([
				"a",
			]);
		});
	});
});
