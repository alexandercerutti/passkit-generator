import { default as PKPass } from "../lib/PKPass";

describe("PKPass", () => {
	describe("setBeacons", () => {
		it("should reset instance.props['beacons'] if 'null' is passed as value", () => {
			const pass = new PKPass({}, {});

			pass.setBeacons({
				proximityUUID: "0000000000-00000000",
				major: 4,
				minor: 3,
				relevantText: "This is not the Kevin you are looking for.",
			});

			expect(pass.props["beacons"].length).toBe(1);

			pass.setBeacons(null);

			expect(pass.props["beacons"]).toBeUndefined();
		});

		it("should filter out invalid beacons objects", () => {
			const pass = new PKPass({}, {});

			/** This is invalid, major should be greater than minor */
			pass.setBeacons(
				{
					proximityUUID: "0000000000-00000000",
					major: 2,
					minor: 3,
					relevantText: "This is not the Kevin you are looking for.",
				},
				// @ts-expect-error
				{
					major: 2,
					minor: 3,
				},
				{
					proximityUUID: "0000000000-00000",
					major: 2,
					minor: 1,
				},
			);

			expect(pass.props["beacons"].length).toBe(1);
		});
	});
});
