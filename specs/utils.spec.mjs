import { test } from "node:test";
import assert from "node:assert/strict";
import { processDate, removeHidden } from "../lib/esm/utils.js";

/**
 * `processDate` throws a bare string instead of an Error, so the
 * thrown value has to be matched directly.
 *
 * @param {unknown} error
 * @returns {boolean}
 */

function isInvalidDateError(error) {
	return error === "Invalid date";
}

test("Utils", async (t) => {
	await t.test("removeHidden", async (t) => {
		await t.test("should remove files that start with dot", () => {
			const filesList = [
				"a.png",
				"b.png",
				".DS_Store",
				"not_the_droids_you_are_looking_for.txt",
			];

			assert.deepEqual(removeHidden(filesList), [
				"a.png",
				"b.png",
				"not_the_droids_you_are_looking_for.txt",
			]);
		});
	});

	await t.test("processDate", async (t) => {
		await t.test(
			"should throw Invalid date if args[0] is not a date",
			() => {
				//@ts-expect-error
				assert.throws(() => processDate(5), isInvalidDateError);
				//@ts-expect-error
				assert.throws(() => processDate({}), isInvalidDateError);
				//@ts-expect-error
				assert.throws(() => processDate("ciao"), isInvalidDateError);
				//@ts-expect-error
				assert.throws(() => processDate(true), isInvalidDateError);
			},
		);

		await t.test("should convert a Date object to a valid W3C date", () => {
			assert.equal(
				processDate(new Date("2020-07-01T02:00+02:00")),
				"2020-07-01T00:00:00.000Z",
			);
		});
	});
});
