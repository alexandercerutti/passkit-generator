const Passkit = require("..");

describe("Node-Passkit-generator", function() {
	let pass;
	beforeEach(() => {
		pass = new Passkit.Pass({
			model: "../examples/examplePass.pass",
			certificates: {
				wwdr: "certs/WWDR.pem",
				signerCert: "certs/signerCert.pem",
				signerKey: {
					key: "certs/signerKey.pem",
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
			expect(pass.props["expirationDate"]).toBe(undefined);
			pass.expiration(42);
			expect(pass.props["expirationDate"]).toBe(undefined);
		});

		it("A date with defined format DD-MM-YYYY will apply changes", () => {
			pass.expiration("10-04-2021", "DD-MM-YYYY");
			expect(pass.props["expirationDate"]).toBe("2021-04-10T00:00:00+02:00");
		});

		it("A date with undefined custom format, will apply changes", () => {
			pass.expiration("10-04-2021");
			expect(pass.props["expirationDate"]).toBe("2021-10-04T00:00:00+02:00");
		});

		it("A date with defined format but with slashes will apply changes", () => {
			pass.expiration("10/04/2021", "DD-MM-YYYY");
			expect(pass.props["expirationDate"]).toBe("2021-04-10T00:00:00+02:00");
		});

		it("An invalid date, will not apply changes", () => {
			pass.expiration("32/18/228317");
			expect(pass.props["expirationDate"]).toBe(undefined);

			pass.expiration("32/18/228317", "DD-MM-YYYY");
			expect(pass.props["expirationDate"]).toBe(undefined);			
		});
	});

	describe("relevance()", () => {
		describe("relevance('relevantDate')", () => {
			it("A date with defined format DD-MM-YYYY will apply changes", () => {
				pass.relevance("relevantDate", "10-04-2021", "DD-MM-YYYY");
				expect(pass.props["relevantDate"]).toBe("2021-04-10T00:00:00+02:00");
			});

			it("A date with undefined custom format, will apply changes", () => {
				pass.relevance("relevantDate", "10-04-2021");
				expect(pass.props["relevantDate"]).toBe("2021-10-04T00:00:00+02:00");
			});

			it("A date with defined format but with slashes will apply changes", () => {
				pass.relevance("relevantDate", "10/04/2021", "DD-MM-YYYY");
				expect(pass.props["relevantDate"]).toBe("2021-04-10T00:00:00+02:00");
			});
		});

		describe("relevance('maxDistance')", () => {
			it("A string is accepted and converted to Number", () => {
				pass.relevance("maxDistance", "150");
				expect(pass.props["maxDistance"]).toBe(150);
			});

			it("A number is accepeted and will apply changes", () => {
				pass.relevance("maxDistance", 150);
				expect(pass.props["maxDistance"]).toBe(150);
			});

			it("Passing NaN value won't apply changes", () => {
				pass.relevance("maxDistance", NaN);
				expect(pass.props["maxDistance"]).toBe(undefined);
			});
		});

		describe("relevance('locations') && relevance('beacons')", () => {
			it("A one-Invalid-schema location won't apply changes", () => {
				pass.relevance("locations", [{
					"ibrupofene": "no",
					"longitude": 0.00000000
				}]);

				expect(pass.props["locations"]).toBe(undefined);
			});

			it("A two locations, with one invalid, will be filtered", () => {
				pass.relevance("locations", [{
					"ibrupofene": "no",
					"longitude": 0.00000000
				}, {
					"longitude": 4.42634523,
					"latitude": 5.344233323352
				}]);

				expect(pass.props["locations"].length).toBe(1);
			});
		});
	});

	describe("barcode()", () => {
		it("Missing data will won't apply changes", () => {
			pass.barcode();

			expect(pass.props["barcode"]).toBe(undefined);
			expect(pass.props["barcodes"]).toBe(undefined);
		});

		it("Boolean parameter won't apply changes", () => {
			pass.barcode(true);

			expect(pass.props["barcode"]).toBe(undefined);
			expect(pass.props["barcodes"]).toBe(undefined);
		});

		it("Numeric parameter won't apply changes", () => {
			pass.barcode(42);

			expect(pass.props["barcode"]).toBe(undefined);
			expect(pass.props["barcodes"]).toBe(undefined);
		});

		it("String parameter will autogenerate all the objects", () => {
			pass.barcode("28363516282");

			expect(pass.props["barcode"] instanceof Object).toBe(true);
			expect(pass.props["barcode"].message).toBe("28363516282");
			expect(pass.props["barcodes"].length).toBe(4);
		});

		it("Object parameter will be automatically converted to one-element Array", () => {
			pass.barcode({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "utf8"
			});

			expect(pass.props["barcode"] instanceof Object).toBe(true);
			expect(pass.props["barcode"].format).toBe("PKBarcodeFormatPDF417");
			expect(pass.props["barcodes"].length).toBe(1);
		});

		it("Array parameter will apply changes", () => {
			pass.barcode({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "utf8"
			});

			expect(pass.props["barcode"] instanceof Object).toBe(true);
			expect(pass.props["barcode"].format).toBe("PKBarcodeFormatPDF417");
			expect(pass.props["barcodes"].length).toBe(1);
		});

		it("Missing messageEncoding gets automatically added.", () => {
			pass.barcode([{
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
			}]);

			expect(pass.props["barcode"] instanceof Object).toBe(true);
			expect(pass.props["barcode"].messageEncoding).toBe("iso-8859-1");
			expect(pass.props["barcodes"][0].messageEncoding).toBe("iso-8859-1");
		});

		it("Object without message property, will be filtered out", () => {
			pass.barcode([{
				format: "PKBarcodeFormatPDF417",
			}]);

			expect(pass.props["barcode"]).toBe(undefined);
			expect(pass.props["barcodes"]).toBe(undefined);
		});

		it("Array containing non-object elements will be filtered out", () => {
			pass.barcode([5, 10, 15, {
				message: "28363516282",
				format: "PKBarcodeFormatPDF417"
			}, 7, 1]);

			expect(pass.props["barcode"] instanceof Object).toBe(true);
			expect(pass.props["barcodes"].length).toBe(1);
			expect(pass.props["barcodes"][0] instanceof Object).toBe(true);
		})
	});
});
