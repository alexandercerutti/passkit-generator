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
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["expirationDate"]).toBe(undefined);
			// @ts-ignore -- Ignoring for test purposes
			pass.expiration(42);
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["expirationDate"]).toBe(undefined);
		});

		it("A date as a Date object will apply changes", () => {
			pass.expiration(new Date(2020,5,1,0,0,0));
			// this is made to avoid problems with winter and summer time:
			// we focus only on the date and time for the tests.
			// @ts-ignore -- Ignoring for test purposes
			let noTimeZoneDateTime = pass._props["expirationDate"].split("+")[0];
			expect(noTimeZoneDateTime).toBe("2020-06-01T00:00:00");
		});

		it("An invalid date, will not apply changes", () => {
			// @ts-ignore -- Ignoring for test purposes
			pass.expiration("32/18/228317");
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["expirationDate"]).toBe(undefined);

			// @ts-ignore -- Ignoring for test purposes
			pass.expiration("32/18/228317");
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["expirationDate"]).toBe(undefined);
		});
	});

	describe("Relevancy:", () => {
		describe("Relevant Date", () => {
			it("A date object will apply changes", () => {
				pass.relevantDate(new Date("10-04-2021"));
				// this is made to avoid problems with winter and summer time:
				// we focus only on the date and time for the tests.
				// @ts-ignore -- Ignoring for test purposes
				let noTimeZoneDateTime = pass._props["relevantDate"].split("+")[0];
				expect(noTimeZoneDateTime).toBe("2021-10-04T00:00:00");
			});
		});

		describe("locations :: ", () => {
			it("One-Invalid-schema location won't apply changes", () => {
				const oldAmountOfLocations = pass.locations().length;

				pass.locations({
					// @ts-ignore
					"ibrupofene": "no",
					"longitude": 0.00000000
				});

				// @ts-ignore -- Ignoring for test purposes
				expect(pass._props["locations"].length).toBe(oldAmountOfLocations);
			});

			it("Two locations, with one invalid, will be filtered", () => {
				const oldAmountOfLocations = pass.locations().length;

				pass.locations({
					//@ts-ignore
					"ibrupofene": "no",
					"longitude": 0.00000000
				}, {
					"longitude": 4.42634523,
					"latitude": 5.344233323352
				});

				// @ts-ignore -- Ignoring for test purposes
				expect(pass._props["locations"].length).toBe(oldAmountOfLocations+1);
			});
		});

		describe("Beacons :: ", () => {
			it("One-Invalid-schema beacon data won't apply changes", () => {
				pass.beacons({
					// @ts-ignore
					"ibrupofene": "no",
					"major": 55,
					"minor": 0,
					"proximityUUID": "2707c5f4-deb9-48ff-b760-671bc885b6a7"
				});

				// @ts-ignore -- Ignoring for test purposes
				expect(pass._props["beacons"]).toBe(undefined);
			});

			it("Two beacons sets, with one invalid, will be filtered", () => {
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
				});

				// @ts-ignore -- Ignoring for test purposes
				expect(pass._props["beacons"].length).toBe(1);
			});
		});
	});

	describe("barcode()", () => {
		it("Missing data will return the current data", () => {
			const oldAmountOfBarcodes = pass.barcode().length;

			// @ts-ignore -- Ignoring for test purposes
			expect(pass.barcode().length).toBe(oldAmountOfBarcodes);
		});

		it("Boolean parameter won't apply changes", () => {
			const oldAmountOfBarcodes = pass.barcode().length;

			// @ts-ignore -- Ignoring for test purposes
			pass.barcode(true);

			// @ts-ignore -- Ignoring for test purposes
			expect(pass.barcode().length).toBe(oldAmountOfBarcodes);
		});

		it("Numeric parameter won't apply changes", () => {
			const oldAmountOfBarcodes = pass.barcode().length;

			// @ts-ignore -- Ignoring for test purposes
			pass.barcode(42);

			// @ts-ignore -- Ignoring for test purposes
			expect(pass.barcode().length).toBe(oldAmountOfBarcodes);
		});

		it("String parameter will autogenerate all the objects", () => {
			pass.barcode("28363516282");

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"] instanceof Object).toBe(true);
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"].message).toBe("28363516282");
			expect(pass.barcode().length).toBe(4);
		});

		it("Object parameter will be accepted", () => {
			pass.barcode({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "utf8"
			});

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"] instanceof Object).toBe(true);
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"].format).toBe("PKBarcodeFormatPDF417");
			// @ts-ignore -- Ignoring for test purposes
			expect(pass.barcode().length).toBe(1);
		});

		it("Array parameter will apply changes", () => {
			pass.barcode({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "utf8"
			});

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"] instanceof Object).toBe(true);
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"].format).toBe("PKBarcodeFormatPDF417");
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcodes"].length).toBe(1);
		});

		it("Missing messageEncoding gets automatically added.", () => {
			pass.barcode({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
			});

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"] instanceof Object).toBe(true);
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"].messageEncoding).toBe("iso-8859-1");
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcodes"][0].messageEncoding).toBe("iso-8859-1");
		});

		it("Object without message property, will be filtered out", () => {
			const oldAmountOfBarcodes = pass.barcode().length;

			// @ts-ignore -- Ignoring for test purposes
			pass.barcode({
				format: "PKBarcodeFormatPDF417",
			});

			// @ts-ignore -- Ignoring for test purposes
			expect(pass.barcode().length).toBe(oldAmountOfBarcodes);
		});

		it("Array containing non-object elements will be rejected", () => {
			const oldAmountOfBarcodes = pass.barcode().length;
			// @ts-ignore -- Ignoring for test purposes
			pass.barcode(5, 10, 15, {
				message: "28363516282",
				format: "PKBarcodeFormatPDF417"
			}, 7, 1);

			// @ts-ignore -- Ignoring for test purposes
			expect(pass.barcode().length).toBe(1)
		});
	});

	describe("barcode().backward()", () => {
		it("Passing argument of type different from string or null, won't apply changes", function () {
			pass
				.barcode("Message-22645272183")
				// @ts-ignore -- Ignoring for test purposes
				.backward(5);

			// unchanged
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"].format).toBe("PKBarcodeFormatQR");
		});

		it("Null will delete backward support", () => {
			(pass.barcode("Message-22645272183") as PassWithBarcodeMethods)
				.backward(null);

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"]).toBe(undefined);
		});

		it("Unknown format won't apply changes", () => {
			pass
				.barcode("Message-22645272183")
				// @ts-ignore -- Ignoring for test purposes
				.backward("PKBingoBongoFormat");

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"].format).toBe("PKBarcodeFormatQR");
		});
	});
});
