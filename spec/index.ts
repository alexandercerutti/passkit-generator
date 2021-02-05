import { createPass, Pass } from "..";

/**
 * Tests created upon Jasmine testing suite.
 */

describe("Passkit-generator", function () {
	let pass: Pass;
	beforeEach(async () => {
		pass = await createPass({
			model: "examples/models/examplePass.pass",
			certificates: {
				wwdr: "certificates/WWDR.pem",
				signerCert: "certificates/signerCert.pem",
				signerKey: {
					keyFile: "certificates/signerKey.pem",
					passphrase: "123456"
				}
			},
			overrides: {}
		});
	});

	describe("Model validation", () => {
		it("Should reject with non valid model", async () => {
			await expectAsync(createPass({
				// @ts-expect-error
				model: 0,
				certificates: {
					wwdr: "certificates/WWDR.pem",
					signerCert: "certificates/signerCert.pem",
					signerKey: {
						keyFile: "certificates/signerKey.pem",
						passphrase: "123456"
					}
				},
				overrides: {}
			})).toBeRejected();

			await expectAsync(createPass({
				model: undefined,
				certificates: {
					wwdr: "certificates/WWDR.pem",
					signerCert: "certificates/signerCert.pem",
					signerKey: {
						keyFile: "certificates/signerKey.pem",
						passphrase: "123456"
					}
				},
				overrides: {}
			})).toBeRejected();

			await expectAsync(createPass({
				model: null,
				certificates: {
					wwdr: "certificates/WWDR.pem",
					signerCert: "certificates/signerCert.pem",
					signerKey: {
						keyFile: "certificates/signerKey.pem",
						passphrase: "123456"
					}
				},
				overrides: {}
			})).toBeRejected();

			await expectAsync(createPass({
				model: {},
				certificates: {
					wwdr: "certificates/WWDR.pem",
					signerCert: "certificates/signerCert.pem",
					signerKey: {
						keyFile: "certificates/signerKey.pem",
						passphrase: "123456"
					}
				},
				overrides: {}
			})).toBeRejected();
		});
	});

	describe("localize()", () => {
		it("Won't apply changes without at least one parameter", () => {
			// @ts-expect-error
			pass.localize();
			expect(Object.keys(pass["l10nTranslations"]).length).toBe(0);
		});

		it("Won't apply changes with a non-string first argument", () => {
			// @ts-expect-error
			pass.localize(5);
			expect(Object.keys(pass["l10nTranslations"]).length).toBe(0);
		});

		it("Will include .lproj folder if only the first argument is passed", () => {
			pass.localize("en");
			expect(Object.keys(pass["l10nTranslations"]).length).toBe(1);
		});

		it("Will ignore all the second argument is not object or undefined", () => {
			// @ts-expect-error
			pass.localize("en", 42);
			expect(Object.keys(pass["l10nTranslations"]).length).toBe(0);
		});

		it("Will apply changes if a second object argument with translations is passed", () => {
			pass.localize("it", {
				"Test": "Prova"
			});

			expect(typeof pass["l10nTranslations"]["it"]).toBe("object");
			expect(pass["l10nTranslations"]["it"]["Test"]).toBe("Prova");
		});
	});

	describe("expiration()", () => {
		it("Won't apply changes withouta valid argument", () => {
			// @ts-expect-error
			pass.expiration();
			expect(pass.props["expirationDate"]).toBe(undefined);
			// @ts-expect-error
			pass.expiration(42);
			expect(pass.props["expirationDate"]).toBe(undefined);
		});

		it("Will set expiration with a Date as argument", () => {
			pass.expiration(new Date(2020, 5, 1, 0, 0, 0));
			// this is made to avoid problems with winter and summer time:
			// we focus only on the date and time for the tests.
			let noTimeZoneDateTime = pass.props["expirationDate"].split("+")[0];
			expect(noTimeZoneDateTime).toBe("2020-06-01T00:00:00");
		});

		it("An invalid date, will not apply changes", () => {
			// @ts-expect-error
			pass.expiration("32/18/228317");
			expect(pass.props["expirationDate"]).toBe(undefined);

			// @ts-expect-error
			pass.expiration("32/18/228317");
			expect(pass.props["expirationDate"]).toBe(undefined);
		});
	});

	describe("relevantDate()", () => {
		it("A date object will apply changes", () => {
			pass.relevantDate(new Date("10-04-2021"));
			// this is made to avoid problems with winter and summer time:
			// we focus only on the date and time for the tests.
			let noTimeZoneDateTime = pass.props["relevantDate"].split("+")[0];
			expect(noTimeZoneDateTime).toBe("2021-10-04T00:00:00");
		});
	});

	describe("locations()", () => {
		it("Won't apply changes if invalid location objects are passed", () => {
			const props = pass.props["locations"] || [];
			const oldAmountOfLocations = props && props.length || 0;

			pass.locations({
				// @ts-expect-error
				"ibrupofene": "no",
				"longitude": 0.00000000
			}, ...props);

			if (oldAmountOfLocations) {
				expect(pass.props["locations"].length).toBe(oldAmountOfLocations);
			} else {
				expect(pass.props["locations"]).toBe(undefined);
			}
		});

		it("Will filter out invalid location objects", () => {
			const props = pass.props["locations"] || [];
			const oldAmountOfLocations = props && props.length || 0;

			pass.locations({
				// @ts-expect-error
				"ibrupofene": "no",
				"longitude": 0.00000000
			}, {
				"longitude": 4.42634523,
				"latitude": 5.344233323352
			}, ...(pass.props["locations"] || []));

			expect(pass.props["locations"].length).toBe((oldAmountOfLocations || 0) + 1);
		});
	});

	describe("Beacons()", () => {
		it("Won't apply changes if invalid beacon objects are passed", () => {
			const props = pass.props["beacons"] || [];
			const oldAmountOfBeacons = props && props.length || 0;

			pass.beacons({
				// @ts-expect-error
				"ibrupofene": "no",
				"major": 55,
				"minor": 0,
				"proximityUUID": "2707c5f4-deb9-48ff-b760-671bc885b6a7"
			}, ...props);

			if (oldAmountOfBeacons) {
				expect(pass.props["beacons"].length).toBe(oldAmountOfBeacons);
			} else {
				expect(pass.props["beacons"]).toBe(undefined);
			}
		});

		it("Will filter out invalid beacons objects", () => {
			const props = pass.props["beacons"] || [];
			const oldAmountOfBeacons = props && props.length || 0;

			pass.beacons({
				"major": 55,
				"minor": 0,
				"proximityUUID": "59da0f96-3fb5-43aa-9028-2bc796c3d0c5"
			}, {
				"major": 55,
				"minor": 0,
				"proximityUUID": "fdcbbf48-a4ae-4ffb-9200-f8a373c5c18e",
				// @ts-expect-error
				"animal": "Monkey"
			}, ...props);


			expect(pass.props["beacons"].length).toBe(oldAmountOfBeacons + 1);
		});
	});

	describe("barcodes()", () => {
		it("Won't apply changes if no data is passed", () => {
			const props = pass.props["barcodes"] || [];
			const oldAmountOfBarcodes = props && props.length || 0;

			pass.barcodes();
			expect(pass.props["barcodes"].length).toBe(oldAmountOfBarcodes);
		});

		it("Will ignore boolean parameter", () => {
			const props = pass.props["barcodes"] || [];
			const oldAmountOfBarcodes = props && props.length || 0;

			// @ts-expect-error
			pass.barcode(true);
			expect(props.length).toBe(oldAmountOfBarcodes);
		});

		it("Will ignore numeric parameter", () => {
			const props = pass.props["barcodes"] || [];
			const oldAmountOfBarcodes = props && props.length || 0;

			// @ts-expect-error
			pass.barcodes(42);
			expect(pass.props["barcodes"].length).toBe(oldAmountOfBarcodes);
		});

		it("Will autogenerate all the barcode objects with a string parameter (message)", () => {
			pass.barcodes("28363516282");
			expect(pass.props["barcodes"].length).toBe(4);
		});

		it("Will accept object parameters", () => {
			pass.barcodes({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "utf8"
			});

			expect(pass.props["barcodes"].length).toBe(1);
		});

		it("Will automatically add messageEncoding if missing in valid Barcodes objects", () => {
			pass.barcodes({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
			});

			expect(pass.props["barcodes"][0].messageEncoding).toBe("iso-8859-1");
		});

		it("Will ignore objects without message property", () => {
			const props = pass.props["barcodes"] || [];
			const oldAmountOfBarcodes = props && props.length || 0;

			// @ts-expect-error
			pass.barcodes({
				format: "PKBarcodeFormatPDF417",
			});

			expect(pass.props["barcodes"].length).toBe(oldAmountOfBarcodes);
		});

		it("Will ignore non-Barcodes schema compliant objects", () => {
			// @ts-expect-error
			pass.barcodes(5, 10, 15, {
				message: "28363516282",
				format: "PKBarcodeFormatPDF417"
			}, 7, 1);

			expect(pass.props["barcodes"].length).toBe(1)
		});

		it("Will reset barcodes content if parameter is null", () => {
			pass.barcodes(null);
			expect(pass.props["barcodes"]).toBe(undefined);
		});
	});

	describe("barcode retrocompatibility", () => {
		it("Will ignore non string or null arguments", function () {
			const oldBarcode = pass.props["barcode"] || undefined;

			pass
				.barcodes("Message-22645272183")
				// @ts-expect-error
				.barcode(55)

			// unchanged
			expect(pass.props["barcode"]).toEqual(oldBarcode);
		});

		it("Will reset backward value on null", () => {
			pass.barcodes("Message-22645272183")
				.barcode("PKBarcodeFormatAztec");

			expect(pass.props["barcode"].format).toBe("PKBarcodeFormatAztec");

			pass.barcode(null);
			expect(pass.props["barcode"]).toBe(undefined);
		});

		it("Won't apply changes if unknown format is passed", () => {
			const oldBarcode = pass.props["barcode"] || undefined;

			pass
				.barcodes("Message-22645272183")
				// @ts-expect-error
				.barcode("PKBingoBongoFormat");

			expect(pass.props["barcode"]).toEqual(oldBarcode);
		});
	});
});
