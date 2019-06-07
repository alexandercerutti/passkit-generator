const Passkit = require("..");

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
	let pass;
	beforeEach(() => {
		pass = new Passkit.Pass({
			model: "../examples/examplePass.pass",
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
			pass.localize();
			expect(Object.keys(pass.l10n).length).toBe(0);
		});

		it("Passing first argument not a string, won't apply changes", () => {
			pass.localize(5);
			expect(Object.keys(pass.l10n).length).toBe(0);
		});

		it("Not passing the second argument, will apply changes (.lproj folder inclusion)", () => {
			pass.localize("en");
			expect(Object.keys(pass.l10n).length).toBe(1);
		});

		it("Second argument of type different from object or undefined, won't apply changes.", () => {
			pass.localize("en", 42);
			expect(Object.keys(pass.l10n).length).toBe(0);
		});

		it("A second argument of type object will apply changes", () => {
			pass.localize("it", {
				"Test": "Prova"
			});

			expect(typeof pass.l10n["it"]).toBe("object");
			expect(pass.l10n["it"]["Test"]).toBe("Prova");
		});
	});

	describe("expiration()", () => {
		it("Missing first argument or not a string won't apply changes", () => {
			pass.expiration();
			expect(pass._props["expirationDate"]).toBe(undefined);
			pass.expiration(42);
			expect(pass._props["expirationDate"]).toBe(undefined);
		});

		it("A date with defined format DD-MM-YYYY will apply changes", () => {
			pass.expiration("10-04-2021", "DD-MM-YYYY");
			// this is made to avoid problems with winter and summer time:
			// we focus only on the date and time for the tests.
			let noTimeZoneDateTime = pass._props["expirationDate"].split("+")[0];
			expect(noTimeZoneDateTime).toBe("2021-04-10T00:00:00");
		});

		it("A date with undefined custom format, will apply changes", () => {
			pass.expiration("10-04-2021");
			// this is made to avoid problems with winter and summer time:
			// we focus only on the date and time for the tests.
			let noTimeZoneDateTime = pass._props["expirationDate"].split("+")[0];
			expect(noTimeZoneDateTime).toBe("2021-10-04T00:00:00");
		});

		it("A date with defined format but with slashes will apply changes", () => {
			pass.expiration("10/04/2021", "DD-MM-YYYY");
			// this is made to avoid problems with winter and summer time:
			// we focus only on the date and time for the tests.
			let noTimeZoneDateTime = pass._props["expirationDate"].split("+")[0];
			expect(noTimeZoneDateTime).toBe("2021-04-10T00:00:00");
		});

		it("A date as a Date object will apply changes", () => {
			pass.expiration(new Date(2020,5,1,0,0,0));
			// this is made to avoid problems with winter and summer time:
			// we focus only on the date and time for the tests.
			let noTimeZoneDateTime = pass._props["expirationDate"].split("+")[0];
			expect(noTimeZoneDateTime).toBe("2020-06-01T00:00:00");
		});

		it("An invalid date, will not apply changes", () => {
			pass.expiration("32/18/228317");
			expect(pass._props["expirationDate"]).toBe(undefined);

			pass.expiration("32/18/228317", "DD-MM-YYYY");
			expect(pass._props["expirationDate"]).toBe(undefined);
		});
	});

	describe("relevance()", () => {
		describe("relevance('relevantDate')", () => {
			it("A date with defined format DD-MM-YYYY will apply changes", () => {
				pass.relevance("relevantDate", "10-04-2021", "DD-MM-YYYY");
				// this is made to avoid problems with winter and summer time:
				// we focus only on the date and time for the tests.
				let noTimeZoneDateTime = pass._props["relevantDate"].split("+")[0];
				expect(noTimeZoneDateTime).toBe("2021-04-10T00:00:00");
			});

			it("A date with undefined custom format, will apply changes", () => {
				pass.relevance("relevantDate", "10-04-2021");
				// this is made to avoid problems with winter and summer time:
				// we focus only on the date and time for the tests.
				let noTimeZoneDateTime = pass._props["relevantDate"].split("+")[0];
				expect(noTimeZoneDateTime).toBe("2021-10-04T00:00:00");
			});

			it("A date with defined format but with slashes will apply changes", () => {
				pass.relevance("relevantDate", "10/04/2021", "DD-MM-YYYY");
				// this is made to avoid problems with winter and summer time:
				// we focus only on the date and time for the tests.
				let noTimeZoneDateTime = pass._props["relevantDate"].split("+")[0];
				expect(noTimeZoneDateTime).toBe("2021-04-10T00:00:00");
			});

			it("A date as a Date object will apply changes", () => {
				pass.relevance("relevantDate",new Date(2020,5,1,0,0,0));
				// this is made to avoid problems with winter and summer time:
				// we focus only on the date and time for the tests.
				let noTimeZoneDateTime = pass._props["relevantDate"].split("+")[0];
				expect(noTimeZoneDateTime).toBe("2020-06-01T00:00:00");
			});			
		});

		describe("relevance('maxDistance')", () => {
			it("A string is accepted and converted to Number", () => {
				pass.relevance("maxDistance", "150");
				expect(pass._props["maxDistance"]).toBe(150);
			});

			it("A number is accepeted and will apply changes", () => {
				pass.relevance("maxDistance", 150);
				expect(pass._props["maxDistance"]).toBe(150);
			});

			it("Passing NaN value won't apply changes", () => {
				pass.relevance("maxDistance", NaN);
				expect(pass._props["maxDistance"]).toBe(undefined);
			});
		});

		describe("relevance('locations') && relevance('beacons')", () => {
			it("A one-Invalid-schema location won't apply changes", () => {
				pass.relevance("locations", [{
					"ibrupofene": "no",
					"longitude": 0.00000000
				}]);

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

				expect(pass._props["locations"].length).toBe(1);
			});
		});
	});

	describe("barcode()", () => {
		it("Missing data will won't apply changes", () => {
			pass.barcode();

			expect(pass._props["barcode"]).toBe(undefined);
			expect(pass._props["barcodes"]).toBe(undefined);
		});

		it("Boolean parameter won't apply changes", () => {
			pass.barcode(true);

			expect(pass._props["barcode"]).toBe(undefined);
			expect(pass._props["barcodes"]).toBe(undefined);
		});

		it("Numeric parameter won't apply changes", () => {
			pass.barcode(42);

			expect(pass._props["barcode"]).toBe(undefined);
			expect(pass._props["barcodes"]).toBe(undefined);
		});

		it("String parameter will autogenerate all the objects", () => {
			pass.barcode("28363516282");

			expect(pass._props["barcode"] instanceof Object).toBe(true);
			expect(pass._props["barcode"].message).toBe("28363516282");
			expect(pass._props["barcodes"].length).toBe(4);
		});

		it("Object parameter will be automatically converted to one-element Array", () => {
			pass.barcode({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "utf8"
			});

			expect(pass._props["barcode"] instanceof Object).toBe(true);
			expect(pass._props["barcode"].format).toBe("PKBarcodeFormatPDF417");
			expect(pass._props["barcodes"].length).toBe(1);
		});

		it("Array parameter will apply changes", () => {
			pass.barcode({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "utf8"
			});

			expect(pass._props["barcode"] instanceof Object).toBe(true);
			expect(pass._props["barcode"].format).toBe("PKBarcodeFormatPDF417");
			expect(pass._props["barcodes"].length).toBe(1);
		});

		it("Missing messageEncoding gets automatically added.", () => {
			pass.barcode([{
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
			}]);

			expect(pass._props["barcode"] instanceof Object).toBe(true);
			expect(pass._props["barcode"].messageEncoding).toBe("iso-8859-1");
			expect(pass._props["barcodes"][0].messageEncoding).toBe("iso-8859-1");
		});

		it("Object without message property, will be filtered out", () => {
			pass.barcode([{
				format: "PKBarcodeFormatPDF417",
			}]);

			expect(pass._props["barcode"]).toBe(undefined);
			expect(pass._props["barcodes"]).toBe(undefined);
		});

		it("Array containing non-object elements will be filtered out", () => {
			pass.barcode([5, 10, 15, {
				message: "28363516282",
				format: "PKBarcodeFormatPDF417"
			}, 7, 1]);

			expect(pass._props["barcode"] instanceof Object).toBe(true);
			expect(pass._props["barcodes"].length).toBe(1);
			expect(pass._props["barcodes"][0] instanceof Object).toBe(true);
		});
	});

	describe("barcode().backward()", () => {
		it("Passing argument of type different from string or null, won't apply changes", function () {
			pass
				.barcode("Message-22645272183")
				.backward(5);

			// unchanged
			expect(pass._props["barcode"].format).toBe("PKBarcodeFormatQR");
		});

		it("Null will delete backward support", () => {
			pass
				.barcode("Message-22645272183")
				.backward(null);

			expect(pass._props["barcode"]).toBe(undefined);
		});

		it("Unknown format won't apply changes", () => {
			pass
				.barcode("Message-22645272183")
				.backward("PKBingoBongoFormat");

			expect(pass._props["barcode"].format).toBe("PKBarcodeFormatQR");
		});
	});
});
