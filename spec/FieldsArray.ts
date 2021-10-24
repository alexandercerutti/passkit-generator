import { PKPass } from "../lib";
import FieldsArray from "../lib/FieldsArray";
import * as Messages from "../lib/messages";

describe("FieldsArray", () => {
	let fa: FieldsArray;
	let frozen = false;
	let pool: Set<string>;

	beforeEach(() => {
		frozen = false;
		pool = new Set<string>();
		fa = new FieldsArray(
			{
				get isFrozen() {
					return frozen;
				},
			} as PKPass /** Fake pass. This is okay for testing */,
			pool,
		);
	});

	it("should extend an array", () => {
		expect(fa instanceof Array).toBe(true);
	});

	describe("push", () => {
		it("should prevent adding new fields if pass is frozen", () => {
			frozen = true;

			expect(() => fa.push({ key: "t1", value: "v1" })).toThrowError(
				Error,
				Messages.BUNDLE.CLOSED,
			);
		});

		it("should allow adding fields", () => {
			expect(fa.push({ key: "t1", value: "v1" })).toBe(1);
			expect(fa.length).toBe(1);
			expect(fa[0]).toEqual({ key: "t1", value: "v1" });
		});

		it("should add the key to the pool", () => {
			fa.push({ key: "t1", value: "v1" });

			expect(pool.has("t1")).toBe(true);
		});

		it("should log a warning if key already exists and omit that object", () => {
			fa.push({ key: "t1", value: "v1" });

			console.warn = jasmine.createSpy("log");

			fa.push({ key: "t1", value: "v1" });

			expect(console.warn).toHaveBeenCalledWith(
				Messages.FIELDS.REPEATED_KEY.replace("%s", "t1"),
			);

			expect(fa.length).toBe(1);
		});
	});

	describe("pop", () => {
		beforeEach(() => {
			fa.push({ key: "t1", value: "v1" });
		});

		it("should prevent popping out fields if pass is frozen", () => {
			frozen = true;

			expect(() => fa.pop()).toThrowError(Error, Messages.BUNDLE.CLOSED);
		});

		it("should popping out fields", () => {
			expect(fa.pop()).toEqual({ key: "t1", value: "v1" });
			expect(fa.length).toBe(0);
			expect(fa[0]).toBeUndefined();
		});

		it("should remove the key from the pool", () => {
			expect(pool.has("t1")).toBe(true);

			fa.pop();

			expect(pool.has("t1")).toBe(false);
		});
	});

	describe("splice", () => {
		beforeEach(() => {
			fa.push({ key: "t1", value: "v1" });
		});

		it("should prevent splicing fields if pass is frozen", () => {
			frozen = true;

			expect(() =>
				fa.splice(0, 1, { key: "k1", value: "v1" }),
			).toThrowError(Error, Messages.BUNDLE.CLOSED);
		});

		it("should remove the key from the pool", () => {
			expect(pool.has("t1")).toBe(true);

			fa.splice(0, 1, { key: "k1", value: "v2" });

			expect(pool.has("t1")).toBe(false);
			expect(pool.has("k1")).toBe(true);
		});

		it("should log a warning if key already exists and omit that object", () => {
			fa.push({ key: "t2", value: "v2" });
			fa.push({ key: "t3", value: "v3" });
			fa.push({ key: "t4", value: "v4" });

			console.warn = jasmine.createSpy("log");

			fa.splice(0, 1, { key: "t2", value: "v2" });

			expect(console.warn).toHaveBeenCalledWith(
				Messages.FIELDS.REPEATED_KEY.replace("%s", "t2"),
			);

			expect(fa.length).toBe(3);
		});
	});

	describe("shift", () => {
		beforeEach(() => {
			fa.push({ key: "t1", value: "v1" });
			fa.push({ key: "t2", value: "v2" });
		});

		it("should prevent popping out fields if pass is frozen", () => {
			frozen = true;

			expect(() => fa.shift()).toThrowError(
				Error,
				Messages.BUNDLE.CLOSED,
			);
		});

		it("should shift out fields", () => {
			expect(fa.shift()).toEqual({ key: "t1", value: "v1" });
			expect(fa.length).toBe(1);
			expect(fa[0]).toEqual({ key: "t2", value: "v2" });
		});

		it("should remove the key from the pool", () => {
			expect(pool.has("t1")).toBe(true);

			fa.shift();

			expect(pool.has("t1")).toBe(false);
		});
	});

	describe("unshift", () => {
		it("should prevent adding new fields if pass is frozen", () => {
			frozen = true;

			expect(() => fa.unshift({ key: "t1", value: "v1" })).toThrowError(
				Error,
				Messages.BUNDLE.CLOSED,
			);
		});

		it("should allow adding fields", () => {
			expect(fa.unshift({ key: "t1", value: "v1" })).toBe(1);
			expect(fa.length).toBe(1);
			expect(fa[0]).toEqual({ key: "t1", value: "v1" });
		});

		it("should add the key to the pool", () => {
			fa.unshift({ key: "t1", value: "v1" });

			expect(pool.has("t1")).toBe(true);
		});

		it("should log a warning if key already exists and omit that object", () => {
			fa.push({ key: "t1", value: "v1" });

			console.warn = jasmine.createSpy("log");

			fa.unshift({ key: "t1", value: "v1" });

			expect(console.warn).toHaveBeenCalledWith(
				Messages.FIELDS.REPEATED_KEY.replace("%s", "t1"),
			);

			expect(fa.length).toBe(1);
		});
	});
});
