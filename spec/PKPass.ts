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

	describe("setLocations", () => {
		it("should reset instance.props['locations'] if 'null' is passed as value", () => {
			const pass = new PKPass({}, {});

			pass.setLocations({
				longitude: 0.25456342344,
				latitude: 0.26665773234,
			});

			expect(pass.props["locations"].length).toBe(1);

			pass.setLocations(null);

			expect(pass.props["locations"]).toBeUndefined();
		});

		it("should filter out invalid beacons objects", () => {
			const pass = new PKPass({}, {});

			pass.setLocations(
				{
					// @ts-expect-error
					longitude: "unknown",
					// @ts-expect-error
					latitude: "unknown",
				},
				{
					altitude: "say hello from here",
					longitude: 0.25456342344,
				},
				{
					longitude: 0.25456342344,
					latitude: 0.26665773234,
					altitude: 12552.31233321,
					relevantText:
						/** Hi mom, see how do I fly! */
						"Ciao mamma, guarda come volooo!",
				},
			);

			expect(pass.props["locations"].length).toBe(1);
			expect(pass.props["locations"][0].longitude).toBe(0.25456342344);
			expect(pass.props["locations"][0].latitude).toBe(0.26665773234);
			expect(pass.props["locations"][0].altitude).toBe(12552.31233321);
			expect(pass.props["locations"][0].relevantText).toBe(
				"Ciao mamma, guarda come volooo!",
			);
		});
	});

	describe("setNFCCapability", () => {
		it("should reset instance.props['nfc'] if 'null' is passed as value", () => {
			const pass = new PKPass({}, {});

			pass.setNFCCapability({
				encryptionPublicKey: "mimmo",
				message: "No message for you here",
			});

			expect(pass.props["nfc"]).toEqual({
				encryptionPublicKey: "mimmo",
				message: "No message for you here",
			});

			pass.setNFCCapability(null);

			expect(pass.props["nfc"]).toBeUndefined();
		});

		it("should not accept invalid objects", () => {
			const pass = new PKPass({}, {});

			pass.setNFCCapability({
				// @ts-expect-error
				requiresAuth: false,
				encryptionPublicKey: "Nope",
			});

			expect(pass.props["nfc"]).toBeUndefined();
		});
	});
});
