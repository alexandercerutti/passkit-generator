// @ts-check
const {
	beforeEach,
	beforeAll,
	expect,
	it,
	describe,
} = require("@jest/globals");
const fs = require("node:fs");
const path = require("node:path");
const { default: PKPass } = require("../lib/PKPass");

const SIGNER_CERT =
	process.env.SIGNER_CERT ||
	fs.readFileSync(path.resolve(__dirname, "../certificates/signerCert.pem"));
const SIGNER_KEY =
	process.env.SIGNER_KEY ||
	fs.readFileSync(path.resolve(__dirname, "../certificates/signerKey.pem"));
const WWDR =
	process.env.WWDR ||
	fs.readFileSync(path.resolve(__dirname, "../certificates/WWDR.pem"));
const SIGNER_KEY_PASSPHRASE = process.env.SIGNER_KEY_PASSPHRASE || "123456";

/**
 * @type {Record<string, Buffer>}
 */

const modelFiles = {};

const EXAMPLE_PATH_RELATIVE = "../examples/models/examplePass.pass";

function unpackFolder(folder) {
	const entryList = fs.readdirSync(path.resolve(__dirname, folder));

	const fileList = {};

	for (let entry of entryList) {
		const relativeFilePath = path.resolve(__dirname, folder, entry);

		const stats = fs.lstatSync(relativeFilePath);

		if (stats.isDirectory()) {
			const directoryFilesList = Object.entries(
				unpackFolder(relativeFilePath),
			);
			Object.assign(
				fileList,
				directoryFilesList.reduce((acc, [file, content]) => {
					return {
						...acc,
						[`${entry}/${file}`]: content,
					};
				}, {}),
			);
		} else {
			fileList[entry] = fs.readFileSync(relativeFilePath);
		}
	}

	return fileList;
}

function getGeneratedPassJson(pkpass) {
	const buffers = pkpass.getAsRaw();
	return JSON.parse(buffers["pass.json"].toString("utf-8"));
}

describe("PKPass", () => {
	beforeAll(() => {
		Object.assign(modelFiles, unpackFolder(EXAMPLE_PATH_RELATIVE));
	});

	/**
	 * @type {PKPass}
	 */
	let pkpass;

	beforeEach(() => {
		pkpass = new PKPass(modelFiles, {
			signerCert: SIGNER_CERT,
			signerKey: SIGNER_KEY,
			wwdr: WWDR,
			signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
		});
	});

	it("should throw an error if certificates provided are not complete or invalid", () => {
		expect(() => {
			// @ts-expect-error
			pkpass.certificates = {
				signerCert: "",
			};
		}).toThrow();

		expect(() => {
			pkpass.certificates = {
				// @ts-expect-error
				signerCert: 5,
				// @ts-expect-error
				signerKey: 3,
				wwdr: "",
			};
		}).toThrow();

		expect(() => {
			pkpass.certificates = {
				// @ts-expect-error
				signerCert: undefined,
				// @ts-expect-error
				signerKey: null,
				wwdr: "",
			};
		}).toThrow();
	});

	it("should own pkpass mimetype", () => {
		expect(pkpass.mimeType).toBe("application/vnd.apple.pkpass");
	});

	it("should throw error if a non recognized type is assigned", () => {
		expect(
			() =>
				// @ts-expect-error
				(pkpass.type = "asfdg"),
		).toThrowError();
	});

	it("should throw if fields getters are accessed without specifying a type first", () => {
		/** Resetting pass.json */
		const passjson = modelFiles["pass.json"];
		const changedPassJson = Buffer.from(
			JSON.stringify(
				Object.assign({}, JSON.parse(passjson.toString("utf-8")), {
					eventTicket: undefined,
					boardingPass: undefined,
					coupon: undefined,
					storeCard: undefined,
					generic: undefined,
					transitType: undefined,
				}),
			),
			"utf-8",
		);

		pkpass = new PKPass(
			Object.assign({}, modelFiles, { "pass.json": changedPassJson }),
			{
				signerCert: SIGNER_CERT,
				signerKey: SIGNER_KEY,
				wwdr: WWDR,
				signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
			},
		);

		expect(() => pkpass.headerFields).toThrowError();
		expect(() => pkpass.primaryFields).toThrowError();
		expect(() => pkpass.auxiliaryFields).toThrowError();
		expect(() => pkpass.secondaryFields).toThrowError();
		expect(() => pkpass.backFields).toThrowError();
		expect(() => pkpass.transitType).toThrowError();
	});

	it("should throw if transitType is set on a non-boardingPass", () => {
		pkpass.type = "eventTicket";
		expect(() => (pkpass.transitType = "PKTransitTypeAir")).toThrowError();
		expect(() => pkpass.transitType).toThrowError();
	});

	it("should throw if transitType is not specified on a boardingPass", () => {
		pkpass.type = "boardingPass";
		expect(() => pkpass.getAsRaw()).toThrowError();
	});

	it("should include the transitType if generating a boardingPass", () => {
		pkpass.type = "boardingPass";
		pkpass.transitType = "PKTransitTypeAir";

		expect(pkpass.transitType).toBe("PKTransitTypeAir");

		const passjsonGenerated = getGeneratedPassJson(pkpass);
		expect(passjsonGenerated.boardingPass).not.toBeUndefined();
		expect(passjsonGenerated.boardingPass.transitType).toBe(
			"PKTransitTypeAir",
		);
	});

	it("should import transitType and fields from a pass.json", () => {
		pkpass = new PKPass(
			{
				...modelFiles,
				"pass.json": Buffer.from(
					JSON.stringify({
						...modelFiles["pass.json"],
						boardingPass: {
							transitType: "PKTransitTypeAir",
							primaryFields: [
								{
									key: "blue",
									value: "not-blue",
								},
							],
							headerFields: [
								{
									key: "red",
									value: "not-red",
								},
							],
						},
					}),
				),
			},
			{
				signerCert: SIGNER_CERT,
				signerKey: SIGNER_KEY,
				signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
				wwdr: WWDR,
			},
		);

		const passjsonGenerated = getGeneratedPassJson(pkpass);

		expect(passjsonGenerated.boardingPass).not.toBeUndefined();
		expect(passjsonGenerated.boardingPass.transitType).toBe(
			"PKTransitTypeAir",
		);
		expect(passjsonGenerated.boardingPass.primaryFields).toBeInstanceOf(
			Array,
		);
		expect(passjsonGenerated.boardingPass.primaryFields.length).toBe(1);
	});

	it("should include fields modifications inside final pass.json", () => {
		/** Resetting fields */
		pkpass.type = "eventTicket";

		pkpass.primaryFields.push({
			key: "testField-pf",
			value: "test",
		});
		pkpass.headerFields.push({
			key: "testField-hf",
			value: "test",
		});
		pkpass.auxiliaryFields.push({
			key: "testField-af",
			value: "test",
		});
		pkpass.secondaryFields.push({
			key: "testField-sf",
			value: "test",
		});
		pkpass.backFields.push({
			key: "testField-bf",
			value: "test",
		});

		const passjsonGenerated = getGeneratedPassJson(pkpass);

		const {
			headerFields,
			primaryFields,
			auxiliaryFields,
			secondaryFields,
			backFields,
		} = passjsonGenerated.eventTicket;

		expect(primaryFields[0]).toEqual({
			key: "testField-pf",
			value: "test",
		});
		expect(headerFields[0]).toEqual({
			key: "testField-hf",
			value: "test",
		});
		expect(auxiliaryFields[0]).toEqual({
			key: "testField-af",
			value: "test",
		});
		expect(secondaryFields[0]).toEqual({
			key: "testField-sf",
			value: "test",
		});
		expect(backFields[0]).toEqual({
			key: "testField-bf",
			value: "test",
		});
	});

	it("should omit fields with the same keys in final pass.json", () => {
		/** Resetting fields */
		pkpass.type = "eventTicket";

		pkpass.primaryFields.push({
			key: "testField-pf",
			value: "test",
		});

		pkpass.headerFields.push({
			key: "testField-pf",
			value: "test",
		});

		const passjsonGenerated = getGeneratedPassJson(pkpass);
		expect(passjsonGenerated.eventTicket.headerFields.length).toBe(0);
	});

	it("should include row property in auxiliary fields but omit it in others", () => {
		/** Resetting fields */
		pkpass.type = "eventTicket";

		pkpass.primaryFields.push({
			key: "testField-pf",
			value: "test",
			// @ts-expect-error
			row: 0,
		});

		pkpass.auxiliaryFields.push({
			key: "testField-pf",
			value: "test",
			row: 1,
		});

		const passjsonGenerated = getGeneratedPassJson(pkpass);

		expect(passjsonGenerated.eventTicket.auxiliaryFields).toBeInstanceOf(
			Array,
		);

		expect(passjsonGenerated.eventTicket.auxiliaryFields.length).toBe(1);
		expect(passjsonGenerated.eventTicket.auxiliaryFields[0].row).toBe(1);
		expect(passjsonGenerated.eventTicket.primaryFields).toBeInstanceOf(
			Array,
		);
		expect(passjsonGenerated.eventTicket.primaryFields.length).toBe(0);
	});

	it("should reset clear all the fields if the type changes", () => {
		pkpass.type = "boardingPass";

		pkpass.primaryFields.push({
			key: "testField-pf",
			value: "test",
		});
		pkpass.headerFields.push({
			key: "testField-hf",
			value: "test",
		});
		pkpass.auxiliaryFields.push({
			key: "testField-af",
			value: "test",
		});
		pkpass.secondaryFields.push({
			key: "testField-sf",
			value: "test",
		});
		pkpass.backFields.push({
			key: "testField-bf",
			value: "test",
		});

		pkpass.transitType = "PKTransitTypeAir";
		pkpass.type = "eventTicket";

		const passjsonGenerated = getGeneratedPassJson(pkpass);

		const {
			headerFields,
			primaryFields,
			secondaryFields,
			auxiliaryFields,
			backFields,
		} = passjsonGenerated.eventTicket;

		expect(headerFields).toBeInstanceOf(Array);
		expect(headerFields.length).toBe(0);

		expect(primaryFields).toBeInstanceOf(Array);
		expect(primaryFields.length).toBe(0);

		expect(secondaryFields).toBeInstanceOf(Array);
		expect(secondaryFields.length).toBe(0);

		expect(auxiliaryFields).toBeInstanceOf(Array);
		expect(auxiliaryFields.length).toBe(0);

		expect(backFields).toBeInstanceOf(Array);
		expect(backFields.length).toBe(0);
	});

	describe("pkpass should get frozen once an export is done", () => {
		it("getAsRaw", () => {
			pkpass.getAsRaw();

			/** We might want to test all the methods, but methods might change... so should we? */
			expect(() => pkpass.localize("en", { a: "b" })).toThrowError();
		});

		it("getAsBuffer", () => {
			pkpass.getAsBuffer();

			/** We might want to test all the methods, but methods might change... so should we? */
			expect(() => pkpass.localize("en", { a: "b" })).toThrowError();
		});

		it("getAsStream", () => {
			pkpass.getAsStream();

			/** We might want to test all the methods, but methods might change... so should we? */
			expect(() => pkpass.localize("en", { a: "b" })).toThrowError();
		});
	});

	describe("localize and languages", () => {
		it("should delete a language, all of its translations and all of its files, when null is passed as parameter", () => {
			pkpass.addBuffer("it.lproj/icon@3x.png", Buffer.alloc(0));
			pkpass.addBuffer("en.lproj/icon@3x.png", Buffer.alloc(0));

			pkpass.localize("it", null);
			pkpass.localize("en", null);

			const buffers = pkpass.getAsRaw();

			expect(pkpass.languages.length).toBe(0);
			expect(buffers["it.lproj/icon@3x.png"]).toBeUndefined();
			expect(buffers["en.lproj/icon@3x.png"]).toBeUndefined();
		});

		it("should throw if lang is not a string", () => {
			// @ts-expect-error
			expect(() => pkpass.localize(null)).toThrowError();

			// @ts-expect-error
			expect(() => pkpass.localize(undefined)).toThrowError();

			// @ts-expect-error
			expect(() => pkpass.localize(5)).toThrowError();

			// @ts-expect-error
			expect(() => pkpass.localize(true)).toThrowError();

			// @ts-expect-error
			expect(() => pkpass.localize({})).toThrowError();
		});

		it("should create a new pass.strings from passed translations", () => {
			pkpass.localize("en", {
				mimmo: "Domenic",
			});

			const buffers = pkpass.getAsRaw();

			expect(buffers["en.lproj/pass.strings"].toString("utf-8")).toBe(
				'"mimmo" = "Domenic";',
			);
		});
	});

	describe("addBuffer", () => {
		it("should include a file buffer inside the final pass", () => {
			pkpass.addBuffer("icon@3x.png", modelFiles["icon.png"]);

			const buffers = pkpass.getAsRaw();

			expect(buffers["icon@3x.png"]).not.toBeUndefined();
			expect(buffers["icon@3x.png"]).toBe(modelFiles["icon.png"]);
		});

		it("should include localized files buffer inside final pass", () => {
			pkpass.addBuffer("it.lproj/icon@3x.png", modelFiles["icon.png"]);

			const buffers = pkpass.getAsRaw();

			expect(buffers["it.lproj/icon@3x.png"]).not.toBeUndefined();
			expect(buffers["it.lproj/icon@3x.png"]).toBe(
				modelFiles["icon.png"],
			);
		});

		it("should ignore further pass.json addition if already available", () => {
			expect(modelFiles["pass.json"]).not.toBeUndefined();

			pkpass.addBuffer(
				"pass.json",
				Buffer.from(
					JSON.stringify({
						boardingPass: {},
					}),
				),
			);

			const passjsonGenerated = getGeneratedPassJson(pkpass);
			expect(passjsonGenerated.boardingPass).toBeUndefined();
			expect(passjsonGenerated.eventTicket).toBeInstanceOf(Object);
		});

		it("should accept a pass.json if not already added", () => {
			const modelFilesCopy = Object.assign({}, modelFiles, {
				"pass.json": undefined,
			});

			pkpass = new PKPass(modelFilesCopy, {
				signerCert: SIGNER_CERT,
				signerKey: SIGNER_KEY,
				wwdr: WWDR,
				signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
			});

			pkpass.addBuffer(
				"pass.json",
				Buffer.from(
					JSON.stringify({
						boardingPass: {
							primaryFields: [
								{
									key: "test",
									value: "meh",
								},
							],
							transitType: "PKTransitTypeAir",
						},
						description: "my testing pass",
					}),
				),
			);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.boardingPass).not.toBeUndefined();
			expect(passjsonGenerated.boardingPass.primaryFields[0]).toEqual({
				key: "test",
				value: "meh",
			});
			expect(passjsonGenerated.boardingPass.transitType).toBe(
				"PKTransitTypeAir",
			);
		});

		it("should accept personalization files if nfc data is added", () => {
			pkpass.setNFC({
				encryptionPublicKey: "fakeEPK",
				message: "Not-a-valid-message-but-we-dont-care",
			});

			pkpass.addBuffer(
				"personalization.json",
				Buffer.from(
					JSON.stringify({
						requiredPersonalizationFields: [
							"PKPassPersonalizationFieldName",
						],
						description: "reward enrollement test",
					}),
				),
			);

			pkpass.addBuffer(
				"personalizationLogo@2x.png",
				modelFiles["icon.png"],
			);

			const buffers = pkpass.getAsRaw();

			expect(buffers["personalization.json"]).not.toBeUndefined();
			expect(
				JSON.parse(buffers["personalization.json"].toString("utf-8"))
					.requiredPersonalizationFields,
			).not.toBeUndefined();
			expect(
				JSON.parse(buffers["personalization.json"].toString("utf-8"))
					.requiredPersonalizationFields.length,
			).toBe(1);
			expect(
				JSON.parse(buffers["personalization.json"].toString("utf-8"))
					.requiredPersonalizationFields[0],
			).toBe("PKPassPersonalizationFieldName");
		});

		it("should remove personalization files if nfc data is not specified", () => {
			pkpass.addBuffer(
				"personalization.json",
				Buffer.from(
					JSON.stringify({
						requiredPersonalizationFields: [
							"PKPassPersonalizationFieldName",
						],
						description: "reward enrollement test",
					}),
				),
			);

			pkpass.addBuffer(
				"personalizationLogo@2x.png",
				modelFiles["icon.png"],
			);

			const buffers = pkpass.getAsRaw();

			expect(buffers["personalization.json"]).toBeUndefined();
			expect(buffers["personalizationLogo@2x.png"]).toBeUndefined();
		});

		it("should convert Windows paths to unix paths", () => {
			/**
			 * This should not be reassignable, but we are actually able to set it.
			 * And this is fine for testing Windows-like behavior.
			 */

			// @ts-ignore
			path.sep = "\\";

			pkpass.addBuffer("it.lproj\\icon@2x.png", modelFiles["icon.png"]);

			const buffers = pkpass.getAsRaw();

			expect(
				JSON.parse(buffers["manifest.json"].toString("utf-8"))[
					"it.lproj/icon@2x.png"
				],
			).not.toBeUndefined();

			/** Resetting for the next tests */
			// @ts-ignore
			path.sep = "/";
		});

		it("should merge translations files with translations", () => {
			const translationFile = `"MY_DESCRIPTION" = "test";
"MY_DESCRIPTION_2" = "test";`;

			pkpass.addBuffer(
				"en.lproj/pass.strings",
				Buffer.from(translationFile),
			);

			expect(pkpass.languages.length).toBe(1);

			const buffers = pkpass.getAsRaw();

			expect(buffers["en.lproj/pass.strings"]).not.toBeUndefined();
			expect(buffers["en.lproj/pass.strings"].toString("utf-8")).toBe(
				translationFile,
			);
		});

		it("should ignore invalid l10n files", () => {
			const invalidTranslationStrings = `
"Insert Element"="Insert Element
"ErrorString_1= "An unknown error occurred."
			`;

			pkpass.addBuffer(
				"en.lproj/pass.strings",
				Buffer.from(invalidTranslationStrings),
			);

			expect(pkpass.files["en.lproj/pass.strings"]).toBeUndefined();

			const buffers = pkpass.getAsRaw();

			expect(buffers["en.lproj/pass.strings"]).toBeUndefined();
		});
	});

	describe("expiration date", () => {
		it("should set a pass expiration date", () => {
			pkpass.setExpirationDate(new Date(2023, 3, 10));

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.expirationDate).toBe(
				"2023-04-10T00:00:00Z",
			);
		});

		it("should reset an expiration date", () => {
			pkpass.setExpirationDate(new Date(2023, 3, 10));
			pkpass.setExpirationDate(null);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.expirationDate).toBeUndefined();
		});

		it("should throw if an invalid date is received", () => {
			expect(() =>
				// @ts-expect-error
				pkpass.setExpirationDate("32/18/228317"),
			).toThrowError();
			// @ts-expect-error
			expect(() => pkpass.setExpirationDate(undefined)).toThrowError();
			// @ts-expect-error
			expect(() => pkpass.setExpirationDate(5)).toThrowError();
			// @ts-expect-error
			expect(() => pkpass.setExpirationDate({})).toThrowError();
		});
	});

	describe("beacons", () => {
		it("should set pass beacons", () => {
			pkpass.setBeacons({
				proximityUUID: "0000000000",
				relevantText: "immabeacon",
			});

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.beacons.length).toBe(1);
			expect(passjsonGenerated.beacons).toEqual([
				{
					proximityUUID: "0000000000",
					relevantText: "immabeacon",
				},
			]);
		});

		it("should reset beacons", () => {
			pkpass.setBeacons({
				proximityUUID: "0000000000",
				relevantText: "immabeacon",
			});
			pkpass.setBeacons(null);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.beacons).toBeUndefined();
		});
	});

	describe("locations", () => {
		it("should set pass locations", () => {
			pkpass.setLocations({
				latitude: 0,
				longitude: 0,
			});

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.locations.length).toBe(1);
			expect(passjsonGenerated.locations).toEqual([
				{
					latitude: 0,
					longitude: 0,
				},
			]);
		});

		it("should reset locations", () => {
			pkpass.setLocations({
				latitude: 0,
				longitude: 0,
			});
			pkpass.setLocations(null);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.locations).toBeUndefined();
		});
	});

	describe("relevant date", () => {
		it("should set pass relevant date", () => {
			pkpass.setRelevantDate(new Date(2023, 3, 10, 14, 15));

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.relevantDate).toBe("2023-04-10T14:15:00Z");
		});

		it("should reset relevant date", () => {
			pkpass.setRelevantDate(new Date(2023, 3, 10, 14, 15));
			pkpass.setRelevantDate(null);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.relevantDate).toBeUndefined();
		});

		it("should throw if an invalid date is received", () => {
			// @ts-expect-error
			expect(() => pkpass.setRelevantDate("32/18/228317")).toThrowError();
			// @ts-expect-error
			expect(() => pkpass.setRelevantDate(undefined)).toThrowError();
			// @ts-expect-error
			expect(() => pkpass.setRelevantDate(5)).toThrowError();
			// @ts-expect-error
			expect(() => pkpass.setRelevantDate({})).toThrowError();
		});
	});

	describe("barcodes", () => {
		it("should create all barcode structures if a message is used", () => {
			pkpass.setBarcodes("a test barcode");

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.barcode).toBeUndefined();
			expect(passjsonGenerated.barcodes).toBeInstanceOf(Array);
			expect(passjsonGenerated.barcodes.length).toBe(4);
			expect(passjsonGenerated.barcodes).toEqual([
				{
					format: "PKBarcodeFormatQR",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
				{
					format: "PKBarcodeFormatPDF417",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
				{
					format: "PKBarcodeFormatAztec",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
				{
					format: "PKBarcodeFormatCode128",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
			]);
		});

		it("should use only the barcode structure provided", () => {
			pkpass.setBarcodes({
				format: "PKBarcodeFormatQR",
				message: "a test barcode",
			});

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.barcode).toBeUndefined();
			expect(passjsonGenerated.barcodes).toBeInstanceOf(Array);
			expect(passjsonGenerated.barcodes.length).toBe(1);
			expect(passjsonGenerated.barcodes).toEqual([
				{
					format: "PKBarcodeFormatQR",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
			]);
		});

		it("should ignore objects and values that not comply with Schema.Barcodes", () => {
			/**
			 * @type {Parameters<typeof pkpass["setBarcodes"]>}
			 */

			const setBarcodesArguments = [
				// @ts-expect-error
				5,
				// @ts-expect-error
				10,
				// @ts-expect-error
				15,
				{
					message: "28363516282",
					format: "PKBarcodeFormatPDF417",
				},
				// @ts-expect-error
				{
					format: "PKBarcodeFormatPDF417",
				},
				// @ts-expect-error
				7,
				// @ts-expect-error
				1,
			];

			pkpass.setBarcodes(...setBarcodesArguments);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.barcodes).toBeInstanceOf(Array);
			expect(passjsonGenerated.barcodes.length).toBe(1);
			expect(passjsonGenerated.barcodes[0]).toEqual({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "iso-8859-1",
			});
		});
	});

	describe("nfc", () => {
		it("should set pass nfc", () => {
			pkpass.setNFC({
				encryptionPublicKey: "blabla",
				message: "nfc data",
			});

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.nfc).toEqual({
				encryptionPublicKey: "blabla",
				message: "nfc data",
			});
		});

		it("should reset nfc data", () => {
			pkpass.setNFC({
				encryptionPublicKey: "blabla",
				message: "nfc data",
			});
			pkpass.setNFC(null);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			expect(passjsonGenerated.nfc).toBeUndefined();
		});
	});

	describe("props getter", () => {
		it("should return a copy of all props", () => {
			pkpass.setBarcodes({
				format: "PKBarcodeFormatQR",
				message: "a test barcode",
			});

			const firstPropsCheck = pkpass.props;

			pkpass.setBarcodes(null);

			expect(firstPropsCheck.barcodes).toEqual([
				{
					format: "PKBarcodeFormatQR",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
			]);
		});
	});

	describe("PKPass.from", () => {
		it("should clone the properties and the buffers of another pkpass", async () => {
			const passcopy = await PKPass.from(pkpass);
			expect(pkpass).not.toBe(passcopy);

			const buffers1 = pkpass.getAsRaw();
			const buffers2 = passcopy.getAsRaw();

			const fileNames = new Set([
				...Object.keys(buffers1),
				...Object.keys(buffers2),
			]);

			for (let key in fileNames) {
				expect(buffers1[key]).not.toBeUndefined();
				expect(buffers2[key]).not.toBeUndefined();
				expect(buffers1[key]).not.toBe(buffers2[key]);
				expect(buffers1[key]).toEqual(buffers2[key]);
			}

			const passjsonGenerated1 = getGeneratedPassJson(pkpass);
			const passjsonGenerated2 = getGeneratedPassJson(passcopy);
			expect(passjsonGenerated1.eventTicket).toEqual(
				passjsonGenerated2.eventTicket,
			);
		});

		it("should throw error when falsy value is passed as source", () => {
			expect.assertions(5);

			// @ts-expect-error
			expect(PKPass.from(null)).rejects.not.toBeUndefined();
			// @ts-expect-error
			expect(PKPass.from(false)).rejects.not.toBeUndefined();
			// @ts-expect-error
			expect(PKPass.from(undefined)).rejects.not.toBeUndefined();
			// @ts-expect-error
			expect(PKPass.from("")).rejects.not.toBeUndefined();
			// @ts-expect-error
			expect(PKPass.from({})).rejects.not.toBeUndefined();
		});

		it("should read all the files from a fs model", async () => {
			pkpass = await PKPass.from({
				model: path.resolve(__dirname, EXAMPLE_PATH_RELATIVE),
				certificates: {
					signerCert: SIGNER_CERT,
					signerKey: SIGNER_KEY,
					signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
					wwdr: WWDR,
				},
			});

			const buffers = pkpass.getAsRaw();

			console.log(buffers, modelFiles);

			for (let fileName of Object.keys(buffers)) {
				/** Skipping generated files */
				if (
					fileName === "signature" ||
					fileName === "manifest.json" ||
					fileName === "pass.json"
				) {
					continue;
				}

				expect(modelFiles[fileName]).not.toBeUndefined();
				expect(modelFiles[fileName]).toEqual(buffers[fileName]);
			}
		});

		it("should silently filter out manifest and signature files", async () => {
			pkpass = await PKPass.from({
				model: path.resolve(__dirname, EXAMPLE_PATH_RELATIVE),
				certificates: {
					signerCert: SIGNER_CERT,
					signerKey: SIGNER_KEY,
					signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
					wwdr: WWDR,
				},
			});

			pkpass.addBuffer("manifest.json", Buffer.alloc(0));
			pkpass.addBuffer("signature", Buffer.alloc(0));

			expect(pkpass.files["manifest.json"]).toBeUndefined();
			expect(pkpass.files["signature"]).toBeUndefined();
		});

		it("should accept additional properties to be added to new buffer and ignore unknown props", async () => {
			const newPass = await PKPass.from(pkpass, {
				description: "mimmoh",
				serialNumber: "626621523738123",
				// @ts-expect-error
				insert_here_invalid_unknown_parameter_name: false,
			});

			expect(newPass.props.description).toBe("mimmoh");
			expect(newPass.props.serialNumber).toBe("626621523738123");
			expect(
				// @ts-expect-error
				newPass.props.insert_here_invalid_unknown_parameter_name,
			).toBeUndefined();

			const passjsonGenerated = getGeneratedPassJson(newPass);

			expect(passjsonGenerated.description).toBe("mimmoh");
			expect(passjsonGenerated.serialNumber).toBe("626621523738123");
			expect(
				passjsonGenerated.insert_here_invalid_unknown_parameter_name,
			).toBeUndefined();
		});
	});

	describe("PKPass.pack", () => {
		it("should should throw error if not all the files passed are PKPasses", () => {
			expect(
				// @ts-expect-error
				() => PKPass.pack(pkpass, "pass.json", pkpass),
			).toThrowError();
		});

		it("should output a frozen bundle of frozen bundles", () => {
			const pkPassesBundle = PKPass.pack(pkpass, pkpass);

			const buffers = pkPassesBundle.getAsRaw();

			expect(buffers["packed-pass-1.pkpass"]).toBeInstanceOf(Buffer);
			expect(buffers["packed-pass-2.pkpass"]).toBeInstanceOf(Buffer);
			expect(pkpass.isFrozen).toBe(true);
			expect(pkPassesBundle.isFrozen).toBe(true);
		});

		it("should output a bundle with pkpasses mimetype", () => {
			const pkPassesBundle = PKPass.pack(pkpass, pkpass);
			expect(pkPassesBundle.mimeType).toBe(
				"application/vnd.apple.pkpasses",
			);
		});
	});
});
