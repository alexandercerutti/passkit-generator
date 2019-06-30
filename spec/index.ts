import { createPass } from "..";
import { Pass, PassWithBarcodeMethods } from "../src/pass";

/*
 * Yes, I know that I'm checking against "private" properties
 * and that I shouldn't do that, but there's no other way to check
 * the final results for each test. The only possible way is to
 * read the generated stream of the zip file, unzip it
 * (hopefully in memory) and check each property in pass.json file
 * and .lproj directories. I hope who is reading this, will understand.
 *
 * Tests created upon Jasmine testing suite.
 */

describe("Node-Passkit-generator", function () {
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

	describe("localize()", () => {
		it("Won't apply changes without at least one parameter", () => {
			// @ts-ignore -- Ignoring for test purposes
			pass.localize();
			expect(Object.keys(pass.l10nTranslations).length).toBe(0);
		});

		it("Passing first argument not a string, won't apply changes", () => {
			// @ts-ignore -- Ignoring for test purposes
			pass.localize(5);
			expect(Object.keys(pass.l10nTranslations).length).toBe(0);
		});

		it("Not passing the second argument, will apply changes (.lproj folder inclusion)", () => {
			pass.localize("en");
			expect(Object.keys(pass.l10nTranslations).length).toBe(1);
		});

		it("Second argument of type different from object or undefined, won't apply changes.", () => {
			// @ts-ignore -- Ignoring for test purposes
			pass.localize("en", 42);
			expect(Object.keys(pass.l10nTranslations).length).toBe(0);
		});

		it("A second argument of type object will apply changes", () => {
			pass.localize("it", {
				"Test": "Prova"
			});

			expect(typeof pass.l10nTranslations["it"]).toBe("object");
			expect(pass.l10nTranslations["it"]["Test"]).toBe("Prova");
		});
	});

	describe("expiration()", () => {
		it("Missing first argument or not a string won't apply changes", () => {
			// @ts-ignore -- Ignoring for test purposes
			pass.expiration();
			expect(pass.props["expirationDate"]).toBe(undefined);
			// @ts-ignore -- Ignoring for test purposes
			pass.expiration(42);
			expect(pass.props["expirationDate"]).toBe(undefined);
		});

		it("A date as a Date object will apply changes", () => {
			pass.expiration(new Date(2020,5,1,0,0,0));
			// this is made to avoid problems with winter and summer time:
			// we focus only on the date and time for the tests.
			let noTimeZoneDateTime = pass.props["expirationDate"].split("+")[0];
			expect(noTimeZoneDateTime).toBe("2020-06-01T00:00:00");
		});

		it("An invalid date, will not apply changes", () => {
			// @ts-ignore -- Ignoring for test purposes
			pass.expiration("32/18/228317");
			expect(pass.props["expirationDate"]).toBe(undefined);

			// @ts-ignore -- Ignoring for test purposes
			pass.expiration("32/18/228317");
			expect(pass.props["expirationDate"]).toBe(undefined);
		});
	});

	describe("Relevancy:", () => {
		describe("Relevant Date", () => {
			it("A date object will apply changes", () => {
				pass.relevantDate(new Date("10-04-2021"));
				// this is made to avoid problems with winter and summer time:
				// we focus only on the date and time for the tests.
				let noTimeZoneDateTime = pass.props["relevantDate"].split("+")[0];
				expect(noTimeZoneDateTime).toBe("2021-10-04T00:00:00");
			});
		});

		describe("locations :: ", () => {
			it("One-Invalid-schema location won't apply changes", () => {
				const props = pass.props["locations"] || [];
				const oldAmountOfLocations = props && props.length || 0;

				pass.locations({
					// @ts-ignore
					"ibrupofene": "no",
					"longitude": 0.00000000
				}, ...props);

				if (oldAmountOfLocations) {
					expect(pass.props["locations"].length).toBe(oldAmountOfLocations);
				} else {
					expect(pass.props["locations"]).toBe(undefined);
				}
			});

			it("Two locations, with one invalid, will be filtered", () => {
				const props = pass.props["locations"] || [];
				const oldAmountOfLocations = props && props.length || 0;

				pass.locations({
					//@ts-ignore
					"ibrupofene": "no",
					"longitude": 0.00000000
				}, {
					"longitude": 4.42634523,
					"latitude": 5.344233323352
				}, ...(pass.props["locations"] || []));

				expect(pass.props["locations"].length).toBe((oldAmountOfLocations || 0) + 1);
			});
		});

		describe("Beacons :: ", () => {
			it("One-Invalid-schema beacon data won't apply changes", () => {
				const props = pass.props["beacons"] || [];
				const oldAmountOfBeacons = props && props.length || 0;

				pass.beacons({
					// @ts-ignore
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

			it("Two beacons sets, with one invalid, will be filtered out", () => {
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
					// @ts-ignore
					"animal": "Monkey"
				}, ...props);


				expect(pass.props["beacons"].length).toBe(oldAmountOfBeacons + 1);
			});
		});
	});

	describe("barcodes()", () => {
		it("Missing data will left situation unchanged", () => {
			const props = pass.props["barcodes"] || [];
			const oldAmountOfBarcodes = props && props.length || 0;

			pass.barcodes();
			expect(pass.props["barcodes"].length).toBe(oldAmountOfBarcodes);
		});

		it("Boolean parameter won't apply changes", () => {
			const props = pass.props["barcodes"] || [];
			const oldAmountOfBarcodes = props && props.length || 0;

			// @ts-ignore -- Ignoring for test purposes
			pass.barcode(true);
			expect(props.length).toBe(oldAmountOfBarcodes);
		});

		it("Numeric parameter won't apply changes", () => {
			const props = pass.props["barcodes"] || [];
			const oldAmountOfBarcodes = props && props.length || 0;

			// @ts-ignore -- Ignoring for test purposes
			pass.barcodes(42);
			expect(pass.props["barcodes"].length).toBe(oldAmountOfBarcodes);
		});

		it("String parameter will autogenerate all the objects", () => {
			pass.barcodes("28363516282");
			expect(pass.props["barcodes"].length).toBe(4);
		});

		it("Object parameter will be accepted", () => {
			pass.barcodes({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "utf8"
			});

			expect(pass.props["barcodes"].length).toBe(1);
		});

		it("Array parameter will apply changes", () => {
			pass.barcodes({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "utf8"
			});

			expect(pass.props["barcodes"].length).toBe(1);
		});

		it("Missing messageEncoding gets automatically added.", () => {
			pass.barcodes({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
			});

			expect(pass.props["barcodes"][0].messageEncoding).toBe("iso-8859-1");
		});

		it("Object without message property, will be ignored", () => {
			const props = pass.props["barcodes"] || [];
			const oldAmountOfBarcodes = props && props.length || 0;

			// @ts-ignore -- Ignoring for test purposes
			pass.barcodes({
				format: "PKBarcodeFormatPDF417",
			});

			expect(pass.props["barcodes"].length).toBe(oldAmountOfBarcodes);
		});

		it("Array containing non-object elements will be rejected", () => {
			// @ts-ignore -- Ignoring for test purposes
			pass.barcodes(5, 10, 15, {
				message: "28363516282",
				format: "PKBarcodeFormatPDF417"
			}, 7, 1);

			expect(pass.props["barcodes"].length).toBe(1)
		});
	});

	describe("barcode retrocompatibility", () => {
		it("Passing argument of type different from string or null, won't apply changes", function () {
			const oldBarcode = pass.props["barcode"] || undefined;

			pass
				.barcodes("Message-22645272183")
				// @ts-ignore -- Ignoring for test purposes
				.barcode(55)

			// unchanged
			expect(pass.props["barcode"]).toEqual(oldBarcode);
		});

		it("Null will delete backward support", () => {
			pass.barcodes("Message-22645272183")
				.barcode("PKBarcodeFormatAztec");

			expect(pass.props["barcode"].format).toBe("PKBarcodeFormatAztec");

			pass.barcode(null);
			expect(pass.props["barcode"]).toBe(undefined);
		});

		it("Unknown format won't apply changes", () => {
			const oldBarcode = pass.props["barcode"] || undefined;

			pass
				.barcodes("Message-22645272183")
				// @ts-ignore -- Ignoring for test purposes
				.barcode("PKBingoBongoFormat");

			expect(pass.props["barcode"]).toEqual(oldBarcode);
		});
	});
});
