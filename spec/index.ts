import { createPass } from "..";
import { Pass } from "../src/pass";

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

	describe("relevance()", () => {
		describe("relevance('relevantDate')", () => {
			it("A date object will apply changes", () => {
				pass.relevance("relevantDate", new Date("10-04-2021"));
				// this is made to avoid problems with winter and summer time:
				// we focus only on the date and time for the tests.
				// @ts-ignore -- Ignoring for test purposes
				let noTimeZoneDateTime = pass._props["relevantDate"].split("+")[0];
				expect(noTimeZoneDateTime).toBe("2021-04-10T00:00:00");
			});
		});

		describe("relevance('maxDistance')", () => {
			it("A string is accepted and converted to Number", () => {
				pass.relevance("maxDistance", "150");
				// @ts-ignore -- Ignoring for test purposes
				expect(pass._props["maxDistance"]).toBe(150);
			});

			it("A number is accepeted and will apply changes", () => {
				pass.relevance("maxDistance", 150);
				// @ts-ignore -- Ignoring for test purposes
				expect(pass._props["maxDistance"]).toBe(150);
			});

			it("Passing NaN value won't apply changes", () => {
				pass.relevance("maxDistance", NaN);
				// @ts-ignore -- Ignoring for test purposes
				expect(pass._props["maxDistance"]).toBe(undefined);
			});
		});

		describe("relevance('locations') && relevance('beacons')", () => {
			it("A one-Invalid-schema location won't apply changes", () => {
				pass.relevance("locations", [{
					"ibrupofene": "no",
					"longitude": 0.00000000
				}]);

				// @ts-ignore -- Ignoring for test purposes
				expect(pass._props["locations"]).toBe(undefined);
			});

			it("A two locations, with one invalid, will be filtered", () => {
				pass.relevance("locations", [{
					"ibrupofene": "no",
					"longitude": 0.00000000
				}, {
					"longitude": 4.42634523,
					"latitude": 5.344233323352
				}]);

				// @ts-ignore -- Ignoring for test purposes
				expect(pass._props["locations"].length).toBe(1);
			});
		});
	});

	describe("barcode()", () => {
		it("Missing data will won't apply changes", () => {
			// @ts-ignore -- Ignoring for test purposes
			pass.barcode();

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"]).toBe(undefined);
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcodes"]).toBe(undefined);
		});

		it("Boolean parameter won't apply changes", () => {
			pass.barcode(true);

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"]).toBe(undefined);
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcodes"]).toBe(undefined);
		});

		it("Numeric parameter won't apply changes", () => {
			pass.barcode(42);

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"]).toBe(undefined);
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcodes"]).toBe(undefined);
		});

		it("String parameter will autogenerate all the objects", () => {
			pass.barcode("28363516282");

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"] instanceof Object).toBe(true);
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"].message).toBe("28363516282");
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcodes"].length).toBe(4);
		});

		it("Object parameter will be automatically converted to one-element Array", () => {
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
			pass.barcode([{
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
			}]);

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"] instanceof Object).toBe(true);
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"].messageEncoding).toBe("iso-8859-1");
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcodes"][0].messageEncoding).toBe("iso-8859-1");
		});

		it("Object without message property, will be filtered out", () => {
			pass.barcode([{
				format: "PKBarcodeFormatPDF417",
			}]);

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"]).toBe(undefined);
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcodes"]).toBe(undefined);
		});

		it("Array containing non-object elements will be filtered out", () => {
			pass.barcode([5, 10, 15, {
				message: "28363516282",
				format: "PKBarcodeFormatPDF417"
			}, 7, 1]);

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"] instanceof Object).toBe(true);
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcodes"].length).toBe(1);
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcodes"][0] instanceof Object).toBe(true);
		});
	});

	describe("barcode().backward()", () => {
		it("Passing argument of type different from string or null, won't apply changes", function () {
			pass
				.barcode("Message-22645272183")
				.backward(5);

			// unchanged
			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"].format).toBe("PKBarcodeFormatQR");
		});

		it("Null will delete backward support", () => {
			pass
				.barcode("Message-22645272183")
				.backward(null);

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"]).toBe(undefined);
		});

		it("Unknown format won't apply changes", () => {
			pass
				.barcode("Message-22645272183")
				.backward("PKBingoBongoFormat");

			// @ts-ignore -- Ignoring for test purposes
			expect(pass._props["barcode"].format).toBe("PKBarcodeFormatQR");
		});
	});
});
