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
});
