import { processDate, removeHidden } from "../lib/utils";

describe("Utils", () => {
	describe("removeHidden", () => {
		it("should remove files that start with dot", () => {
			const filesList = [
				"a.png",
				"b.png",
				".DS_Store",
				"not_the_droids_you_are_looking_for.txt",
			];

			expect(removeHidden(filesList)).toEqual([
				"a.png",
				"b.png",
				"not_the_droids_you_are_looking_for.txt",
			]);
		});
	});

	describe("processDate", () => {
		it("should throw Invalid date if args[0] is not a date", () => {
			//@ts-expect-error
			expect(() => processDate(5)).toThrow("Invalid date");
			//@ts-expect-error
			expect(() => processDate({})).toThrow("Invalid date");
			//@ts-expect-error
			expect(() => processDate("ciao")).toThrow("Invalid date");
			//@ts-expect-error
			expect(() => processDate(true)).toThrow("Invalid date");
		});

		it("should convert a Date object to a valid W3C date", () => {
			expect(processDate(new Date(2020, 6, 1, 0, 0, 0, 0))).toBe(
				"2020-07-01T00:00:00Z",
			);
		});
	});
});
