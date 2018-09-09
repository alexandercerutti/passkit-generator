const Passkit = require("..");

describe("Node-Passkit-generator", function() {
	var pass = null;
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
});
