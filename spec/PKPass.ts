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

	describe("setExpirationDate", () => {
		it("should reset instance.props['expirationDate'] if 'null' is passed as value", () => {
			const pass = new PKPass({}, {});

			pass.setExpirationDate(new Date(2020, 6, 1, 0, 0, 0, 0));
			// Month starts from 0 in Date Object when used this way, therefore
			// we expect one month more
			expect(pass.props["expirationDate"]).toBe("2020-07-01T00:00:00Z");

			pass.setExpirationDate(null);

			expect(pass.props["expirationDate"]).toBeUndefined();
		});

		it("Won't apply changes without a valid argument", () => {
			const pass = new PKPass({}, {});

			// @ts-expect-error
			pass.setExpirationDate();
			expect(pass.props["expirationDate"]).toBe(undefined);

			// @ts-expect-error
			pass.setExpirationDate(42);
			expect(pass.props["expirationDate"]).toBe(undefined);
		});

		it("expects a Date object as the only argument", () => {
			const pass = new PKPass({}, {});

			pass.setExpirationDate(new Date(2020, 6, 1, 0, 0, 0, 0));
			// Month starts from 0 in Date Object when used this way, therefore
			// we expect one month more
			expect(pass.props["expirationDate"]).toBe("2020-07-01T00:00:00Z");
		});

		it("An invalid date, will not apply changes", () => {
			const pass = new PKPass({}, {});

			// @ts-expect-error
			pass.setExpirationDate("32/18/228317");
			expect(pass.props["expirationDate"]).toBe(undefined);

			// @ts-expect-error
			pass.setExpirationDate("32/18/228317");
			expect(pass.props["expirationDate"]).toBe(undefined);
		});
	});

	describe("setRelevantDate", () => {
		it("should reset instance.props['relevantDate'] if 'null' is passed as value", () => {
			const pass = new PKPass({}, {});

			pass.setRelevantDate(new Date(2020, 6, 1, 0, 0, 0, 0));
			// Month starts from 0 in Date Object when used this way, therefore
			// we expect one month more
			expect(pass.props["relevantDate"]).toBe("2020-07-01T00:00:00Z");

			pass.setRelevantDate(null);

			expect(pass.props["relevantDate"]).toBeUndefined();
		});

		it("Won't apply changes without a valid argument", () => {
			const pass = new PKPass({}, {});

			// @ts-expect-error
			pass.setRelevantDate();
			expect(pass.props["relevantDate"]).toBe(undefined);

			// @ts-expect-error
			pass.setRelevantDate(42);
			expect(pass.props["relevantDate"]).toBe(undefined);
		});

		it("expects a Date object as the only argument", () => {
			const pass = new PKPass({}, {});

			pass.setRelevantDate(new Date("10-04-2021"));
			expect(pass.props["relevantDate"]).toBe("2021-10-04T00:00:00Z");
		});

		it("An invalid date, will not apply changes", () => {
			const pass = new PKPass({}, {});

			// @ts-expect-error
			pass.setRelevantDate("32/18/228317");
			expect(pass.props["relevantDate"]).toBe(undefined);

			// @ts-expect-error
			pass.setRelevantDate("32/18/228317");
			expect(pass.props["relevantDate"]).toBe(undefined);
		});
	});

	describe("setBarcodes", () => {
		it("shouldn't apply changes if no data is passed", () => {
			const pass = new PKPass({}, {});

			const props = pass.props["barcodes"] || [];
			const oldAmountOfBarcodes = props?.length ?? 0;

			pass.setBarcodes();
			expect(pass.props["barcodes"]?.length || 0).toBe(
				oldAmountOfBarcodes,
			);
		});

		it("should throw error if a boolean parameter is received", () => {
			const pass = new PKPass({}, {});

			// @ts-expect-error
			expect(() => pass.setBarcodes(true)).toThrowError(
				TypeError,
				"Expected Schema.Barcode in setBarcodes but no one is valid.",
			);
		});

		it("should ignore if a number parameter is received", () => {
			const pass = new PKPass({}, {});

			// @ts-expect-error
			expect(() => pass.setBarcodes(42)).toThrowError(
				TypeError,
				"Expected Schema.Barcode in setBarcodes but no one is valid.",
			);
		});

		it("should autogenerate all the barcodes objects if a string is provided as message", () => {
			const pass = new PKPass({}, {});

			pass.setBarcodes("28363516282");
			expect(pass.props["barcodes"].length).toBe(4);
		});

		it("should save changes if object conforming to Schemas.Barcode are provided", () => {
			const pass = new PKPass({}, {});

			pass.setBarcodes({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "utf8",
			});

			expect(pass.props["barcodes"].length).toBe(1);
		});

		it("should add 'messageEncoding' if missing in valid Schema.Barcode parameters", () => {
			const pass = new PKPass({}, {});

			pass.setBarcodes({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
			});

			expect(pass.props["barcodes"][0].messageEncoding).toBe(
				"iso-8859-1",
			);
		});

		it("should ignore objects without 'message' property in Schema.Barcode", () => {
			const pass = new PKPass({}, {});

			pass.setBarcodes(
				{
					format: "PKBarcodeFormatCode128",
					message: "No one can validate meeee",
				},
				// @ts-expect-error
				{
					format: "PKBarcodeFormatPDF417",
				},
			);

			expect(pass.props["barcodes"].length).toBe(1);
		});

		it("should ignore objects and values that not comply with Schema.Barcodes", () => {
			const pass = new PKPass({}, {});

			pass.setBarcodes(
				// @ts-expect-error
				5,
				10,
				15,
				{
					message: "28363516282",
					format: "PKBarcodeFormatPDF417",
				},
				7,
				1,
			);

			expect(pass.props["barcodes"].length).toBe(1);
		});

		it("should reset barcodes content if parameter is null", () => {
			const pass = new PKPass({}, {});

			pass.setBarcodes({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "utf8",
			});

			expect(pass.props["barcodes"].length).toBe(1);

			pass.setBarcodes(null);
			expect(pass.props["barcodes"]).toBe(undefined);
		});
	});

	describe("transitType", () => {
		it("should accept a new value only if the pass is a boarding pass", () => {
			const mockBPPassJSON = Buffer.from(
				JSON.stringify({
					boardingPass: {},
				}),
			);

			const mockCPPassJSON = Buffer.from(
				JSON.stringify({
					coupon: {},
				}),
			);

			const passBP = new PKPass(
				{
					"pass.json": mockBPPassJSON,
				},
				{},
			);

			const passCP = new PKPass(
				{
					"pass.json": mockCPPassJSON,
				},
				{},
			);

			/**
			 * @TODO fix this test when props setup
			 * will be complete
			 */

			/* 			expect(() => {
				passBP.transitType = "PKTransitTypeAir";
			}).toThrowError(
				TypeError,
				"Cannot set transitType on a pass with type different from 'boardingPass'.",
			); */
			// expect(passBP.transitType).toBe("PKTransitTypeAir");

			/* 			expect(
				() => (passCP.transitType = "PKTransitTypeAir"),
			).toThrowError(
				TypeError,
				"Cannot set transitType on a pass with type different from 'boardingPass'.",
			);
			expect(passCP.transitType).toBeUndefined(); */
		});
	});
});
