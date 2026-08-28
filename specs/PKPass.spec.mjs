// @ts-check
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import forge from "node-forge";
import { PKPass } from "passkit-generator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @returns {[cert: Buffer, key: Buffer]}
 */

function generateCertificateAndPrivateKey() {
	const keys = forge.pki.rsa.generateKeyPair(2048);
	const cert = forge.pki.createCertificate();

	cert.publicKey = keys.publicKey;

	cert.serialNumber = "01";
	cert.validity.notBefore = new Date();
	cert.validity.notAfter = new Date();
	cert.validity.notAfter.setFullYear(
		cert.validity.notBefore.getFullYear() + 1,
	);

	const attrs = [
		{
			name: "commonName",
			value: "example.org",
		},
		{
			name: "countryName",
			value: "TS",
		},
		{
			shortName: "ST",
			value: "Test",
		},
		{
			name: "localityName",
			value: "Test",
		},
		{
			name: "organizationName",
			value: "Test",
		},
		{
			shortName: "OU",
			value: "Test",
		},
	];

	cert.setIssuer(attrs);
	cert.setSubject(attrs);
	cert.sign(keys.privateKey);

	return [
		Buffer.from(forge.pki.certificateToPem(cert)),
		Buffer.from(forge.pki.privateKeyToPem(keys.privateKey)),
	];
}

const [signerCertBuffer, privateKeyBuffer] = generateCertificateAndPrivateKey();

/**
 * SIGNER_CERT, SIGNER_KEY, WWDR and SIGNER_KEY_PASSPHRASE are also set
 * as secrets in Github for run tests on Github Actions
 */

const SIGNER_CERT = process.env.SIGNER_CERT || signerCertBuffer;
const SIGNER_KEY = process.env.SIGNER_KEY || privateKeyBuffer;
const WWDR =
	process.env.WWDR ||
	fs.readFileSync(path.resolve(__dirname, "../certificates/WWDR.pem"));
const SIGNER_KEY_PASSPHRASE = process.env.SIGNER_KEY_PASSPHRASE || "123456";

/**
 * @type {Record<string, Buffer>}
 */

const modelFiles = {};

const EXAMPLE_PATH_RELATIVE = "../examples/models/examplePass.pass";

/**
 * @param {string} folder
 * @returns
 */

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

test("PKPass", async (t) => {
	t.before(() => {
		Object.assign(modelFiles, unpackFolder(EXAMPLE_PATH_RELATIVE));
	});

	/**
	 * @type {PKPass}
	 */
	let pkpass;

	t.beforeEach(() => {
		pkpass = new PKPass(modelFiles, {
			signerCert: SIGNER_CERT,
			signerKey: SIGNER_KEY,
			wwdr: WWDR,
			signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
		});
	});

	await t.test(
		"should throw an error if certificates provided are not complete or invalid",
		() => {
			assert.throws(() => {
				// @ts-expect-error
				pkpass.certificates = {
					signerCert: "",
				};
			});

			assert.throws(() => {
				pkpass.certificates = {
					// @ts-expect-error
					signerCert: 5,
					// @ts-expect-error
					signerKey: 3,
					wwdr: "",
				};
			});

			assert.throws(() => {
				pkpass.certificates = {
					// @ts-expect-error
					signerCert: undefined,
					// @ts-expect-error
					signerKey: null,
					wwdr: "",
				};
			});
		},
	);

	await t.test("should own pkpass mimetype", () => {
		assert.equal(pkpass.mimeType, "application/vnd.apple.pkpass");
	});

	await t.test(
		"should throw error if a non recognized type is assigned",
		() => {
			assert.throws(
				() =>
					// @ts-expect-error
					(pkpass.type = "asfdg"),
			);
		},
	);

	await t.test(
		"should throw if fields getters are accessed without specifying a type first",
		() => {
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

			assert.throws(() => pkpass.headerFields);
			assert.throws(() => pkpass.primaryFields);
			assert.throws(() => pkpass.auxiliaryFields);
			assert.throws(() => pkpass.secondaryFields);
			assert.throws(() => pkpass.backFields);
			assert.throws(() => pkpass.transitType);
		},
	);

	await t.test(
		"should throw if transitType is set on a non-boardingPass",
		() => {
			pkpass.type = "eventTicket";
			assert.throws(() => (pkpass.transitType = "PKTransitTypeAir"));
			assert.throws(() => pkpass.transitType);
		},
	);

	await t.test(
		"should throw if transitType is not specified on a boardingPass",
		() => {
			pkpass.type = "boardingPass";
			assert.throws(() => pkpass.getAsRaw());
		},
	);

	await t.test(
		"should include the transitType if generating a boardingPass",
		() => {
			pkpass.type = "boardingPass";
			pkpass.transitType = "PKTransitTypeAir";

			assert.equal(pkpass.transitType, "PKTransitTypeAir");

			const passjsonGenerated = getGeneratedPassJson(pkpass);
			assert.notEqual(passjsonGenerated.boardingPass, undefined);
			assert.equal(
				passjsonGenerated.boardingPass.transitType,
				"PKTransitTypeAir",
			);
		},
	);

	await t.test(
		"should import transitType and fields from a pass.json",
		() => {
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

			assert.notEqual(passjsonGenerated.boardingPass, undefined);
			assert.equal(
				passjsonGenerated.boardingPass.transitType,
				"PKTransitTypeAir",
			);
			assert.ok(
				passjsonGenerated.boardingPass.primaryFields instanceof Array,
			);
			assert.equal(
				passjsonGenerated.boardingPass.primaryFields.length,
				1,
			);
		},
	);

	await t.test(
		"should include fields modifications inside final pass.json",
		() => {
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

			assert.deepEqual(primaryFields[0], {
				key: "testField-pf",
				value: "test",
			});
			assert.deepEqual(headerFields[0], {
				key: "testField-hf",
				value: "test",
			});
			assert.deepEqual(auxiliaryFields[0], {
				key: "testField-af",
				value: "test",
			});
			assert.deepEqual(secondaryFields[0], {
				key: "testField-sf",
				value: "test",
			});
			assert.deepEqual(backFields[0], {
				key: "testField-bf",
				value: "test",
			});
		},
	);

	await t.test("should maintain fields addition order", () => {
		/** Resetting fields */
		pkpass.type = "eventTicket";

		pkpass.primaryFields.push(
			{
				key: "testField-pf0",
				value: "test",
			},
			{
				key: "testField-pf1",
				value: "test",
			},
			{
				key: "testField-pf2",
				value: "test",
			},
		);

		const passjsonGenerated = getGeneratedPassJson(pkpass);

		const { primaryFields } = passjsonGenerated.eventTicket;

		assert.deepEqual(primaryFields[0], {
			key: "testField-pf0",
			value: "test",
		});

		assert.deepEqual(primaryFields[1], {
			key: "testField-pf1",
			value: "test",
		});

		assert.deepEqual(primaryFields[2], {
			key: "testField-pf2",
			value: "test",
		});
	});

	await t.test(
		"should omit fields with the same keys in final pass.json",
		() => {
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
			assert.equal(passjsonGenerated.eventTicket.headerFields.length, 0);
		},
	);

	await t.test(
		"should include row property in auxiliary fields but omit it in others",
		() => {
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

			assert.ok(
				passjsonGenerated.eventTicket.auxiliaryFields instanceof Array,
			);

			assert.equal(
				passjsonGenerated.eventTicket.auxiliaryFields.length,
				1,
			);
			assert.equal(
				passjsonGenerated.eventTicket.auxiliaryFields[0].row,
				1,
			);
			assert.ok(
				passjsonGenerated.eventTicket.primaryFields instanceof Array,
			);
			assert.equal(passjsonGenerated.eventTicket.primaryFields.length, 0);
		},
	);

	await t.test(
		"should reset clear all the fields if the type changes",
		() => {
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

			assert.ok(headerFields instanceof Array);
			assert.equal(headerFields.length, 0);

			assert.ok(primaryFields instanceof Array);
			assert.equal(primaryFields.length, 0);

			assert.ok(secondaryFields instanceof Array);
			assert.equal(secondaryFields.length, 0);

			assert.ok(auxiliaryFields instanceof Array);
			assert.equal(auxiliaryFields.length, 0);

			assert.ok(backFields instanceof Array);
			assert.equal(backFields.length, 0);
		},
	);

	await t.test("should export a buffer when getAsBuffer is used", () => {
		assert.ok(pkpass.getAsBuffer() instanceof Buffer);
	});

	await t.test(
		"pkpass should get frozen once an export is done",
		async (t) => {
			await t.test("getAsRaw", () => {
				pkpass.getAsRaw();

				/** We might want to test all the methods, but methods might change... so should we? */
				assert.throws(() => pkpass.localize("en", { a: "b" }));
			});

			await t.test("getAsBuffer", () => {
				pkpass.getAsBuffer();

				/** We might want to test all the methods, but methods might change... so should we? */
				assert.throws(() => pkpass.localize("en", { a: "b" }));
			});

			await t.test("getAsStream", () => {
				pkpass.getAsStream();

				/** We might want to test all the methods, but methods might change... so should we? */
				assert.throws(() => pkpass.localize("en", { a: "b" }));
			});
		},
	);

	await t.test("localize and languages", async (t) => {
		await t.test(
			"should delete a language, all of its translations and all of its files, when null is passed as parameter",
			() => {
				pkpass.addBuffer("it.lproj/icon@3x.png", Buffer.alloc(0));
				pkpass.addBuffer("en.lproj/icon@3x.png", Buffer.alloc(0));

				pkpass.localize("it", null);
				pkpass.localize("en", null);

				const buffers = pkpass.getAsRaw();

				assert.equal(pkpass.languages.length, 0);
				assert.equal(buffers["it.lproj/icon@3x.png"], undefined);
				assert.equal(buffers["en.lproj/icon@3x.png"], undefined);
			},
		);

		await t.test("should throw if lang is not a string", () => {
			// @ts-expect-error
			assert.throws(() => pkpass.localize(null));

			// @ts-expect-error
			assert.throws(() => pkpass.localize(undefined));

			// @ts-expect-error
			assert.throws(() => pkpass.localize(5));

			// @ts-expect-error
			assert.throws(() => pkpass.localize(true));

			// @ts-expect-error
			assert.throws(() => pkpass.localize({}));
		});

		await t.test(
			"should create a new pass.strings from passed translations",
			() => {
				pkpass.localize("en", {
					mimmo: "Domenic",
				});

				const buffers = pkpass.getAsRaw();

				assert.equal(
					buffers["en.lproj/pass.strings"].toString("utf-8"),
					'"mimmo" = "Domenic";',
				);
			},
		);
	});

	await t.test("addBuffer", async (t) => {
		await t.test(
			"should include a file buffer inside the final pass",
			() => {
				pkpass.addBuffer("icon@3x.png", modelFiles["icon.png"]);

				const buffers = pkpass.getAsRaw();

				assert.notEqual(buffers["icon@3x.png"], undefined);
				assert.equal(buffers["icon@3x.png"], modelFiles["icon.png"]);
			},
		);

		await t.test(
			"should include localized files buffer inside final pass",
			() => {
				pkpass.addBuffer(
					"it.lproj/icon@3x.png",
					modelFiles["icon.png"],
				);

				const buffers = pkpass.getAsRaw();

				assert.notEqual(buffers["it.lproj/icon@3x.png"], undefined);
				assert.equal(
					buffers["it.lproj/icon@3x.png"],
					modelFiles["icon.png"],
				);
			},
		);

		await t.test(
			"should ignore further pass.json addition if already available",
			() => {
				assert.notEqual(modelFiles["pass.json"], undefined);

				pkpass.addBuffer(
					"pass.json",
					Buffer.from(
						JSON.stringify({
							boardingPass: {},
						}),
					),
				);

				const passjsonGenerated = getGeneratedPassJson(pkpass);
				assert.equal(passjsonGenerated.boardingPass, undefined);
				assert.ok(passjsonGenerated.eventTicket instanceof Object);
			},
		);

		await t.test("should accept a pass.json if not already added", () => {
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

			assert.notEqual(passjsonGenerated.boardingPass, undefined);
			assert.deepEqual(passjsonGenerated.boardingPass.primaryFields[0], {
				key: "test",
				value: "meh",
			});
			assert.equal(
				passjsonGenerated.boardingPass.transitType,
				"PKTransitTypeAir",
			);
		});

		await t.test(
			"should accept personalization files if nfc data is added",
			() => {
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

				assert.notEqual(buffers["personalization.json"], undefined);
				assert.notEqual(
					JSON.parse(
						buffers["personalization.json"].toString("utf-8"),
					).requiredPersonalizationFields,
					undefined,
				);
				assert.equal(
					JSON.parse(
						buffers["personalization.json"].toString("utf-8"),
					).requiredPersonalizationFields.length,
					1,
				);
				assert.equal(
					JSON.parse(
						buffers["personalization.json"].toString("utf-8"),
					).requiredPersonalizationFields[0],
					"PKPassPersonalizationFieldName",
				);
			},
		);

		await t.test(
			"should remove personalization files if nfc data is not specified",
			() => {
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

				assert.equal(buffers["personalization.json"], undefined);
				assert.equal(buffers["personalizationLogo@2x.png"], undefined);
			},
		);

		await t.test("should convert Windows paths to unix paths", () => {
			/**
			 * This should not be reassignable, but we are actually able to set it.
			 * And this is fine for testing Windows-like behavior.
			 */

			// @ts-ignore
			path.sep = "\\";

			pkpass.addBuffer("it.lproj\\icon@2x.png", modelFiles["icon.png"]);

			const buffers = pkpass.getAsRaw();

			assert.notEqual(
				JSON.parse(buffers["manifest.json"].toString("utf-8"))[
					"it.lproj/icon@2x.png"
				],
				undefined,
			);

			/** Resetting for the next tests */
			// @ts-ignore
			path.sep = "/";
		});

		await t.test(
			"should merge translations files with translations",
			() => {
				const translationFile = `"MY_DESCRIPTION" = "test";
"MY_DESCRIPTION_2" = "test";`;

				pkpass.addBuffer(
					"en.lproj/pass.strings",
					Buffer.from(translationFile),
				);

				assert.equal(pkpass.languages.length, 1);

				const buffers = pkpass.getAsRaw();

				assert.notEqual(buffers["en.lproj/pass.strings"], undefined);
				assert.equal(
					buffers["en.lproj/pass.strings"].toString("utf-8"),
					translationFile,
				);
			},
		);

		await t.test("should ignore invalid l10n files", () => {
			const invalidTranslationStrings = `
"Insert Element"="Insert Element
"ErrorString_1= "An unknown error occurred."
			`;

			pkpass.addBuffer(
				"en.lproj/pass.strings",
				Buffer.from(invalidTranslationStrings),
			);

			assert.equal(pkpass.files["en.lproj/pass.strings"], undefined);

			const buffers = pkpass.getAsRaw();

			assert.equal(buffers["en.lproj/pass.strings"], undefined);
		});
	});

	await t.test("expiration date", async (t) => {
		await t.test("should set a pass expiration date", () => {
			pkpass.setExpirationDate(new Date("2023-04-09T17:00-07:00"));

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			assert.equal(
				passjsonGenerated.expirationDate,
				"2023-04-10T00:00:00.000Z",
			);
		});

		await t.test("should reset an expiration date", () => {
			pkpass.setExpirationDate(new Date(2023, 3, 10));
			pkpass.setExpirationDate(null);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			assert.equal(passjsonGenerated.expirationDate, undefined);
		});

		await t.test("should throw if an invalid date is received", () => {
			assert.throws(() =>
				// @ts-expect-error
				pkpass.setExpirationDate("32/18/228317"),
			);
			// @ts-expect-error
			assert.throws(() => pkpass.setExpirationDate(undefined));
			// @ts-expect-error
			assert.throws(() => pkpass.setExpirationDate(5));
			// @ts-expect-error
			assert.throws(() => pkpass.setExpirationDate({}));
		});
	});

	await t.test("beacons", async (t) => {
		await t.test("should set pass beacons", () => {
			pkpass.setBeacons({
				proximityUUID: "0000000000",
				relevantText: "immabeacon",
			});

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			assert.equal(passjsonGenerated.beacons.length, 1);
			assert.deepEqual(passjsonGenerated.beacons, [
				{
					proximityUUID: "0000000000",
					relevantText: "immabeacon",
				},
			]);
		});

		await t.test("should reset beacons", () => {
			pkpass.setBeacons({
				proximityUUID: "0000000000",
				relevantText: "immabeacon",
			});
			pkpass.setBeacons(null);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			assert.equal(passjsonGenerated.beacons, undefined);
		});
	});

	await t.test("locations", async (t) => {
		await t.test("should set pass locations", () => {
			pkpass.setLocations({
				latitude: 0,
				longitude: 0,
			});

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			assert.equal(passjsonGenerated.locations.length, 1);
			assert.deepEqual(passjsonGenerated.locations, [
				{
					latitude: 0,
					longitude: 0,
				},
			]);
		});

		await t.test("should reset locations", () => {
			pkpass.setLocations({
				latitude: 0,
				longitude: 0,
			});
			pkpass.setLocations(null);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			assert.equal(passjsonGenerated.locations, undefined);
		});
	});

	await t.test("Date relevancy", async (t) => {
		await t.test("(deprecated iOS 18) (root).relevantDate", async (t) => {
			await t.test("should set pass relevant date", () => {
				pkpass.setRelevantDate(new Date("2023-04-11T00:15+10:00"));

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				assert.equal(
					passjsonGenerated.relevantDate,
					"2023-04-10T14:15:00.000Z",
				);
			});

			await t.test("should reset relevant date", () => {
				pkpass.setRelevantDate(new Date(2023, 3, 10, 14, 15));
				pkpass.setRelevantDate(null);

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				assert.equal(passjsonGenerated.relevantDate, undefined);
			});

			await t.test("should throw if an invalid date is received", () => {
				assert.throws(() =>
					// @ts-expect-error
					pkpass.setRelevantDate("32/18/228317"),
				);
				// @ts-expect-error
				assert.throws(() => pkpass.setRelevantDate(undefined));
				// @ts-expect-error
				assert.throws(() => pkpass.setRelevantDate(5));
				// @ts-expect-error
				assert.throws(() => pkpass.setRelevantDate({}));
			});
		});

		await t.test("setRelevantDates", async (t) => {
			await t.test("should accept strings", () => {
				pkpass.setRelevantDates([
					{
						startDate: "2025-01-08T22:17:30.000Z",
						endDate: "2025-01-08T23:58:25.000Z",
					},
					{
						relevantDate: "2025-01-08T22:17:30.000Z",
					},
				]);

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				assert.partialDeepStrictEqual(passjsonGenerated.relevantDates, [
					{
						startDate: "2025-01-08T22:17:30.000Z",
						endDate: "2025-01-08T23:58:25.000Z",
					},
					{
						relevantDate: "2025-01-08T22:17:30.000Z",
					},
				]);
			});

			await t.test("should accept dates", () => {
				pkpass.setRelevantDates([
					{
						startDate: new Date(Date.UTC(2025, 1, 8, 23, 58, 25)),
						endDate: new Date(Date.UTC(2025, 1, 8, 23, 58, 25)),
					},
					{
						relevantDate: new Date(Date.UTC(2025, 1, 8, 23, 58, 25)),
					},
				]);

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				assert.partialDeepStrictEqual(passjsonGenerated.relevantDates, [
					{
						startDate: "2025-02-08T23:58:25.000Z",
						endDate: "2025-02-08T23:58:25.000Z",
					},
					{
						relevantDate: "2025-02-08T23:58:25.000Z",
					},
				]);
			});

			await t.test("should allow resetting", () => {
				pkpass.setRelevantDates([
					{
						startDate: "2025-01-08T22:17:30.000Z",
						endDate: "2025-01-08T23:58:25.000Z",
					},
					{
						relevantDate: "2025-01-08T22:17:30.000Z",
					},
				]);

				pkpass.setRelevantDates(null);

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				assert.equal(passjsonGenerated.relevantDates, undefined);
			});
		});
	});

	await t.test("barcodes", async (t) => {
		await t.test(
			"should create all barcode structures if a message is used",
			() => {
				pkpass.setBarcodes("a test barcode");

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				assert.equal(passjsonGenerated.barcode, undefined);
				assert.ok(passjsonGenerated.barcodes instanceof Array);
				assert.equal(passjsonGenerated.barcodes.length, 4);
				assert.deepEqual(passjsonGenerated.barcodes, [
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
			},
		);

		await t.test("should use only the barcode structure provided", () => {
			pkpass.setBarcodes({
				format: "PKBarcodeFormatQR",
				message: "a test barcode",
			});

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			assert.equal(passjsonGenerated.barcode, undefined);
			assert.ok(passjsonGenerated.barcodes instanceof Array);
			assert.equal(passjsonGenerated.barcodes.length, 1);
			assert.deepEqual(passjsonGenerated.barcodes, [
				{
					format: "PKBarcodeFormatQR",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
			]);
		});

		await t.test(
			"should ignore objects and values that not comply with Schema.Barcodes",
			() => {
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

				assert.ok(passjsonGenerated.barcodes instanceof Array);
				assert.equal(passjsonGenerated.barcodes.length, 1);
				assert.deepEqual(passjsonGenerated.barcodes[0], {
					message: "28363516282",
					format: "PKBarcodeFormatPDF417",
					messageEncoding: "iso-8859-1",
				});
			},
		);
	});

	await t.test("nfc", async (t) => {
		await t.test("should set pass nfc", () => {
			pkpass.setNFC({
				encryptionPublicKey: "blabla",
				message: "nfc data",
			});

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			assert.deepEqual(passjsonGenerated.nfc, {
				encryptionPublicKey: "blabla",
				message: "nfc data",
			});
		});

		await t.test("should reset nfc data", () => {
			pkpass.setNFC({
				encryptionPublicKey: "blabla",
				message: "nfc data",
			});
			pkpass.setNFC(null);

			const passjsonGenerated = getGeneratedPassJson(pkpass);

			assert.equal(passjsonGenerated.nfc, undefined);
		});
	});

	await t.test("props getter", async (t) => {
		await t.test("should return a copy of all props", () => {
			pkpass.setBarcodes({
				format: "PKBarcodeFormatQR",
				message: "a test barcode",
			});

			const firstPropsCheck = pkpass.props;

			pkpass.setBarcodes(null);

			assert.deepEqual(firstPropsCheck.barcodes, [
				{
					format: "PKBarcodeFormatQR",
					message: "a test barcode",
					messageEncoding: "iso-8859-1",
				},
			]);
		});
	});

	await t.test("PKPass.from", async (t) => {
		await t.test(
			"should clone the properties and the buffers of another pkpass",
			async () => {
				const passcopy = await PKPass.from(pkpass);
				assert.notEqual(pkpass, passcopy);

				const buffers1 = pkpass.getAsRaw();
				const buffers2 = passcopy.getAsRaw();

				const fileNames = new Set([
					...Object.keys(buffers1),
					...Object.keys(buffers2),
				]);

				for (let key in fileNames) {
					assert.notEqual(buffers1[key], undefined);
					assert.notEqual(buffers2[key], undefined);
					assert.notEqual(buffers1[key], buffers2[key]);
					assert.deepEqual(buffers1[key], buffers2[key]);
				}

				const passjsonGenerated1 = getGeneratedPassJson(pkpass);
				const passjsonGenerated2 = getGeneratedPassJson(passcopy);
				assert.deepEqual(
					passjsonGenerated1.eventTicket,
					passjsonGenerated2.eventTicket,
				);
			},
		);

		await t.test(
			"should throw error when falsy value is passed as source",
			async () => {
				// @ts-expect-error
				await assert.rejects(() => PKPass.from(null));
				// @ts-expect-error
				await assert.rejects(() => PKPass.from(false));
				// @ts-expect-error
				await assert.rejects(() => PKPass.from(undefined));
				// @ts-expect-error
				await assert.rejects(() => PKPass.from(""));
				// @ts-expect-error
				await assert.rejects(() => PKPass.from({}));
			},
		);

		await t.test("should read all the files from a fs model", async () => {
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

			for (let fileName of Object.keys(buffers)) {
				/** Skipping generated files */
				if (
					fileName === "signature" ||
					fileName === "manifest.json" ||
					fileName === "pass.json"
				) {
					continue;
				}

				assert.notEqual(modelFiles[fileName], undefined);
				assert.deepEqual(modelFiles[fileName], buffers[fileName]);
			}
		});

		await t.test(
			"should throw an error if a model folder doesn't exist",
			async () => {
				await assert.rejects(
					() =>
						PKPass.from({
							model: path.resolve(
								__dirname,
								"this/model/doesnt/exists.pass",
							),
						}),
					Error,
				);
			},
		);

		await t.test("should enforce .pass model extension", async () => {
			await assert.doesNotReject(
				async () =>
					await PKPass.from({
						model: path.resolve(
							__dirname,
							"../examples/models/examplePass",
						),
						certificates: {
							signerCert: SIGNER_CERT,
							signerKey: SIGNER_KEY,
							signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
							wwdr: WWDR,
						},
					}),
			);
		});

		await t.test(
			"should silently filter out manifest and signature files",
			async () => {
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

				assert.equal(pkpass.files["manifest.json"], undefined);
				assert.equal(pkpass.files["signature"], undefined);
			},
		);

		await t.test(
			"should accept additional properties to be added to new buffer and ignore unknown props",
			async () => {
				const newPass = await PKPass.from(pkpass, {
					description: "mimmoh",
					serialNumber: "626621523738123",
					// @ts-expect-error
					insert_here_invalid_unknown_parameter_name: false,
				});

				assert.equal(newPass.props.description, "mimmoh");
				assert.equal(newPass.props.serialNumber, "626621523738123");
				assert.equal(
					// @ts-expect-error
					newPass.props.insert_here_invalid_unknown_parameter_name,
					undefined,
				);

				const passjsonGenerated = getGeneratedPassJson(newPass);

				assert.equal(passjsonGenerated.description, "mimmoh");
				assert.equal(passjsonGenerated.serialNumber, "626621523738123");
				assert.equal(
					passjsonGenerated.insert_here_invalid_unknown_parameter_name,
					undefined,
				);
			},
		);
	});

	await t.test("PKPass.pack", async (t) => {
		await t.test(
			"should should throw error if not all the files passed are PKPasses",
			() => {
				assert.throws(
					// @ts-expect-error
					() => PKPass.pack(pkpass, "pass.json", pkpass),
				);
			},
		);

		await t.test("should output a frozen bundle of frozen bundles", () => {
			const pkPassesBundle = PKPass.pack(pkpass, pkpass);

			const buffers = pkPassesBundle.getAsRaw();

			assert.ok(buffers["packed-pass-1.pkpass"] instanceof Buffer);
			assert.ok(buffers["packed-pass-2.pkpass"] instanceof Buffer);
			assert.equal(pkpass.isFrozen, true);
			assert.equal(pkPassesBundle.isFrozen, true);
		});

		await t.test("should output a bundle with pkpasses mimetype", () => {
			const pkPassesBundle = PKPass.pack(pkpass, pkpass);
			assert.equal(
				pkPassesBundle.mimeType,
				"application/vnd.apple.pkpasses",
			);
		});
	});

	await t.test("iOS 18 / iOS 26 new layouts", async (t) => {
		await t.test(
			"should contain preferredStyleSchemes if coming from an imported pass json",
			() => {
				const passjson = modelFiles["pass.json"];
				const changedPassJson = Buffer.from(
					JSON.stringify(
						Object.assign(
							{},
							JSON.parse(passjson.toString("utf-8")),
							{
								preferredStyleSchemes: [
									"posterEventTicket",
									"eventTicket",
								],
								eventTicket: {},
							},
						),
					),
					"utf-8",
				);

				pkpass = new PKPass(
					Object.assign({}, modelFiles, {
						"pass.json": changedPassJson,
					}),
					{
						signerCert: SIGNER_CERT,
						signerKey: SIGNER_KEY,
						wwdr: WWDR,
						signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
					},
				);

				assert.deepEqual(pkpass.preferredStyleSchemes, [
					"posterEventTicket",
					"eventTicket",
				]);

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				assert.notEqual(
					passjsonGenerated.preferredStyleSchemes,
					undefined,
				);
				assert.deepEqual(passjsonGenerated.preferredStyleSchemes, [
					"posterEventTicket",
					"eventTicket",
				]);
			},
		);

		await t.test(
			"should contain preferredStyleSchemes if coming from the setter (legacy order)",
			() => {
				pkpass.type = "eventTicket";

				pkpass.preferredStyleSchemes = [
					"eventTicket",
					"posterEventTicket",
				];

				assert.deepEqual(pkpass.preferredStyleSchemes, [
					"eventTicket",
					"posterEventTicket",
				]);

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				assert.notEqual(
					passjsonGenerated.preferredStyleSchemes,
					undefined,
				);
				assert.deepEqual(passjsonGenerated.preferredStyleSchemes, [
					"eventTicket",
					"posterEventTicket",
				]);
			},
		);

		await t.test(
			"should contain preferredStyleSchemes if coming from the setter (new order)",
			() => {
				pkpass.type = "eventTicket";

				pkpass.preferredStyleSchemes = [
					"posterEventTicket",
					"eventTicket",
				];

				assert.deepEqual(pkpass.preferredStyleSchemes, [
					"posterEventTicket",
					"eventTicket",
				]);

				const passjsonGenerated = getGeneratedPassJson(pkpass);

				assert.notEqual(
					passjsonGenerated.preferredStyleSchemes,
					undefined,
				);
				assert.deepEqual(passjsonGenerated.preferredStyleSchemes, [
					"posterEventTicket",
					"eventTicket",
				]);
			},
		);
	});

	await t.test(
		"preferredStyleSchemes setter should throw if pass is not an eventTicket or boardingPass",
		() => {
			pkpass.type = "storeCard";

			assert.throws(() => {
				pkpass.preferredStyleSchemes = [
					"posterEventTicket",
					"eventTicket",
				];
			});
		},
	);

	await t.test(
		"preferredStyleSchemes getter should throw if pass is not an eventTicket or boardingPass",
		() => {
			pkpass.type = "storeCard";

			assert.throws(() => {
				pkpass.preferredStyleSchemes;
			});
		},
	);
});
