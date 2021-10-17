import { promises as fs } from "fs";
import * as path from "path";
import { filesSymbol, freezeSymbol } from "../lib/Bundle";
import FieldsArray from "../lib/FieldsArray";
import { PassProps } from "../lib/schemas";
import * as Messages from "../lib/messages";
import {
	default as PKPass,
	localizationSymbol,
	certificatesSymbol,
	propsSymbol,
	passTypeSymbol,
	importMetadataSymbol,
	closePassSymbol,
} from "../lib/PKPass";

describe("PKPass", () => {
	let pass: PKPass;
	const baseCerts = {
		signerCert: "",
		signerKey: "",
		wwdr: "",
		signerKeyPassphrase: "p477w0rb",
	};

	beforeEach(() => {
		pass = new PKPass(
			{},
			/** @ts-ignore - We don't need certificates here*/
			baseCerts,
			{},
		);
	});

	describe("setBeacons", () => {
		it("should reset instance.props['beacons'] if 'null' is passed as value", () => {
			pass.setBeacons({
				proximityUUID: "0000000000-00000000",
				major: 4,
				minor: 3,
				relevantText: "This is not the Kevin you are looking for.",
			});

			expect(pass.props["beacons"].length).toBe(1);

			pass.setBeacons(null);

			expect(pass.props["beacons"]).toBeUndefined();
		});

		it("should filter out invalid beacons objects", () => {
			/** This is invalid, major should be greater than minor */
			pass.setBeacons(
				{
					proximityUUID: "0000000000-00000000",
					major: 2,
					minor: 3,
					relevantText: "This is not the Kevin you are looking for.",
				},
				// @ts-expect-error
				{
					major: 2,
					minor: 3,
				},
				{
					proximityUUID: "0000000000-00000",
					major: 2,
					minor: 1,
				},
			);

			expect(pass.props["beacons"].length).toBe(1);
		});

		it("should always return undefined", () => {
			expect(pass.setBeacons(null)).toBeUndefined();
			expect(
				pass.setBeacons({
					proximityUUID: "0000000000-00000000",
					major: 2,
					minor: 3,
					relevantText: "This is not the Kevin you are looking for.",
				}),
			).toBeUndefined();
		});
	});

	describe("setLocations", () => {
		it("should reset instance.props['locations'] if 'null' is passed as value", () => {
			pass.setLocations({
				longitude: 0.25456342344,
				latitude: 0.26665773234,
			});

			expect(pass.props["locations"].length).toBe(1);

			pass.setLocations(null);

			expect(pass.props["locations"]).toBeUndefined();
		});

		it("should filter out invalid beacons objects", () => {
			pass.setLocations(
				{
					// @ts-expect-error
					longitude: "unknown",
					// @ts-expect-error
					latitude: "unknown",
				},
				{
					altitude: "say hello from here",
					longitude: 0.25456342344,
				},
				{
					longitude: 0.25456342344,
					latitude: 0.26665773234,
					altitude: 12552.31233321,
					relevantText:
						/** Hi mom, see how do I fly! */
						"Ciao mamma, guarda come volooo!",
				},
			);

			expect(pass.props["locations"].length).toBe(1);
			expect(pass.props["locations"][0].longitude).toBe(0.25456342344);
			expect(pass.props["locations"][0].latitude).toBe(0.26665773234);
			expect(pass.props["locations"][0].altitude).toBe(12552.31233321);
			expect(pass.props["locations"][0].relevantText).toBe(
				"Ciao mamma, guarda come volooo!",
			);
		});

		it("should always return undefined", () => {
			expect(pass.setLocations(null)).toBeUndefined();
			expect(
				pass.setLocations({
					longitude: 0.25456342344,
					latitude: 0.26665773234,
					altitude: 12552.31233321,
				}),
			).toBeUndefined();
		});
	});

	describe("setNFC", () => {
		it("should reset instance.props['nfc'] if 'null' is passed as value", () => {
			pass.setNFC({
				encryptionPublicKey: "mimmo",
				message: "No message for you here",
			});

			expect(pass.props["nfc"]).toEqual({
				encryptionPublicKey: "mimmo",
				message: "No message for you here",
			});

			pass.setNFC(null);

			expect(pass.props["nfc"]).toBeUndefined();
		});

		it("should throw on invalid objects received", () => {
			expect(() =>
				pass.setNFC({
					// @ts-expect-error
					requiresAuth: false,
					encryptionPublicKey: "Nope",
				}),
			).toThrow();
		});

		it("should always return undefined", () => {
			expect(pass.setNFC(null)).toBeUndefined();
			expect(
				pass.setNFC({
					encryptionPublicKey: "mimmo",
					message: "No message for you here",
				}),
			).toBeUndefined();
		});
	});

	describe("setExpirationDate", () => {
		it("should reset instance.props['expirationDate'] if 'null' is passed as value", () => {
			pass.setExpirationDate(new Date(2020, 6, 1, 0, 0, 0, 0));
			// Month starts from 0 in Date Object when used this way, therefore
			// we expect one month more
			expect(pass.props["expirationDate"]).toBe("2020-07-01T00:00:00Z");

			pass.setExpirationDate(null);

			expect(pass.props["expirationDate"]).toBeUndefined();
		});

		it("expects a Date object as the only argument", () => {
			pass.setExpirationDate(new Date(2020, 6, 1, 0, 0, 0, 0));
			// Month starts from 0 in Date Object when used this way, therefore
			// we expect one month more
			expect(pass.props["expirationDate"]).toBe("2020-07-01T00:00:00Z");
		});

		it("should throw if an invalid date is received", () => {
			// @ts-expect-error
			expect(() => pass.setExpirationDate("32/18/228317")).toThrowError(
				TypeError,
				"Cannot set expirationDate. Invalid date 32/18/228317",
			);

			expect(() => pass.setExpirationDate(undefined)).toThrowError(
				TypeError,
				"Cannot set expirationDate. Invalid date undefined",
			);

			// @ts-expect-error
			expect(() => pass.setExpirationDate(5)).toThrowError(
				TypeError,
				"Cannot set expirationDate. Invalid date 5",
			);

			// @ts-expect-error
			expect(() => pass.setExpirationDate({})).toThrowError(
				TypeError,
				"Cannot set expirationDate. Invalid date [object Object]",
			);
		});

		it("should always return undefined", () => {
			expect(pass.setExpirationDate(null)).toBeUndefined();
			expect(
				pass.setExpirationDate(new Date(2020, 6, 1, 0, 0, 0, 0)),
			).toBeUndefined();
		});
	});

	describe("setRelevantDate", () => {
		it("should reset instance.props['relevantDate'] if 'null' is passed as value", () => {
			pass.setRelevantDate(new Date(2020, 6, 1, 0, 0, 0, 0));
			// Month starts from 0 in Date Object when used this way, therefore
			// we expect one month more
			expect(pass.props["relevantDate"]).toBe("2020-07-01T00:00:00Z");

			pass.setRelevantDate(null);

			expect(pass.props["relevantDate"]).toBeUndefined();
		});

		it("expects a Date object as the only argument", () => {
			pass.setRelevantDate(new Date("10-04-2021"));
			expect(pass.props["relevantDate"]).toBe("2021-10-04T00:00:00Z");
		});

		it("should throw if an invalid date is received", () => {
			// @ts-expect-error
			expect(() => pass.setRelevantDate("32/18/228317")).toThrowError(
				TypeError,
				"Cannot set relevantDate. Invalid date 32/18/228317",
			);

			expect(() => pass.setRelevantDate(undefined)).toThrowError(
				TypeError,
				"Cannot set relevantDate. Invalid date undefined",
			);

			// @ts-expect-error
			expect(() => pass.setRelevantDate(5)).toThrowError(
				TypeError,
				"Cannot set relevantDate. Invalid date 5",
			);

			// @ts-expect-error
			expect(() => pass.setRelevantDate({})).toThrowError(
				TypeError,
				"Cannot set relevantDate. Invalid date [object Object]",
			);
		});

		it("should always return undefined", () => {
			expect(pass.setRelevantDate(null)).toBeUndefined();
			expect(
				pass.setRelevantDate(new Date(2020, 6, 1, 0, 0, 0, 0)),
			).toBeUndefined();
		});
	});

	describe("setBarcodes", () => {
		it("shouldn't apply changes if no data is passed", () => {
			const props = pass.props["barcodes"] || [];
			const oldAmountOfBarcodes = props?.length ?? 0;

			pass.setBarcodes();
			expect(pass.props["barcodes"]?.length || 0).toBe(
				oldAmountOfBarcodes,
			);
		});

		it("should autogenerate all the barcodes objects if a string is provided as message", () => {
			pass.setBarcodes("28363516282");
			expect(pass.props["barcodes"].length).toBe(4);
		});

		it("should save changes if object conforming to Schemas.Barcode are provided", () => {
			pass.setBarcodes({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "utf8",
			});

			expect(pass.props["barcodes"].length).toBe(1);
		});

		it("should add 'messageEncoding' if missing in valid Schema.Barcode parameters", () => {
			pass.setBarcodes({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
			});

			expect(pass.props["barcodes"][0].messageEncoding).toBe(
				"iso-8859-1",
			);
		});

		it("should ignore objects without 'message' property in Schema.Barcode", () => {
			pass.setBarcodes(
				{
					format: "PKBarcodeFormatCode128",
					message: "No one can validate meeee",
				},
				// @ts-expect-error
				{
					format: "PKBarcodeFormatPDF417",
				},
			);

			expect(pass.props["barcodes"].length).toBe(1);
		});

		it("should ignore objects and values that not comply with Schema.Barcodes", () => {
			pass.setBarcodes(
				// @ts-expect-error
				5,
				10,
				15,
				{
					message: "28363516282",
					format: "PKBarcodeFormatPDF417",
				},
				7,
				1,
			);

			expect(pass.props["barcodes"].length).toBe(1);
		});

		it("should reset barcodes content if parameter is null", () => {
			pass.setBarcodes({
				message: "28363516282",
				format: "PKBarcodeFormatPDF417",
				messageEncoding: "utf8",
			});

			expect(pass.props["barcodes"].length).toBe(1);

			pass.setBarcodes(null);
			expect(pass.props["barcodes"]).toBe(undefined);
		});

		it("should always return undefined", () => {
			expect(pass.setBarcodes(null)).toBeUndefined();
			expect(
				pass.setBarcodes({
					message: "28363516282",
					format: "PKBarcodeFormatPDF417",
					messageEncoding: "utf8",
				}),
			).toBeUndefined();
		});
	});

	describe("transitType", () => {
		it("should accept a new value only if the pass is a boarding pass", () => {
			const passBP = new PKPass(
				{
					"pass.json": Buffer.from(
						JSON.stringify({
							boardingPass: {},
						}),
					),
				},
				baseCerts,
				{},
			);

			const passCP = new PKPass(
				{
					"pass.json": Buffer.from(
						JSON.stringify({
							coupon: {},
						}),
					),
				},
				baseCerts,
				{},
			);

			passBP.transitType = "PKTransitTypeAir";
			expect(passBP.transitType).toBe("PKTransitTypeAir");

			expect(
				() => (passCP.transitType = "PKTransitTypeAir"),
			).toThrowError(
				TypeError,
				Messages.TRANSIT_TYPE.UNEXPECTED_PASS_TYPE,
			);

			expect(passCP.transitType).toBeUndefined();
		});
	});

	describe("certificates setter", () => {
		it("should throw an error if certificates provided are not complete or invalid", () => {
			expect(() => {
				// @ts-expect-error
				pass.certificates = {
					signerCert: "",
				};
			}).toThrow();

			expect(() => {
				pass.certificates = {
					// @ts-expect-error
					signerCert: 5,
					// @ts-expect-error
					signerKey: 3,
					wwdr: "",
				};
			}).toThrow();

			expect(() => {
				pass.certificates = {
					signerCert: undefined,
					signerKey: null,
					wwdr: "",
				};
			}).toThrow();

			/** Expecting previous result */
			expect(pass[certificatesSymbol]).toEqual(baseCerts);
		});
	});

	describe("fields getters", () => {
		it("should throw error if a type has not been defined", () => {
			expect(() => pass.primaryFields).toThrowError(
				TypeError,
				"Cannot read properties of undefined (reading 'primaryFields')",
			);
			expect(() => pass.secondaryFields).toThrowError(
				TypeError,
				"Cannot read properties of undefined (reading 'secondaryFields')",
			);
			expect(() => pass.auxiliaryFields).toThrowError(
				TypeError,
				"Cannot read properties of undefined (reading 'auxiliaryFields')",
			);
			expect(() => pass.headerFields).toThrowError(
				TypeError,
				"Cannot read properties of undefined (reading 'headerFields')",
			);
			expect(() => pass.backFields).toThrowError(
				TypeError,
				"Cannot read properties of undefined (reading 'backFields')",
			);
		});

		it("should return an instance of FieldsArray if a type have been set", () => {
			pass.type = "boardingPass";

			expect(pass.primaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.secondaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.auxiliaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.headerFields).toBeInstanceOf(FieldsArray);
			expect(pass.backFields).toBeInstanceOf(FieldsArray);

			/** Resetting Fields, when setting type */
			pass.type = "coupon";

			expect(pass.primaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.secondaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.auxiliaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.headerFields).toBeInstanceOf(FieldsArray);
			expect(pass.backFields).toBeInstanceOf(FieldsArray);

			/** Resetting Fields, when setting type */
			pass.type = "storeCard";

			expect(pass.primaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.secondaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.auxiliaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.headerFields).toBeInstanceOf(FieldsArray);
			expect(pass.backFields).toBeInstanceOf(FieldsArray);

			/** Resetting Fields, when setting type */
			pass.type = "eventTicket";

			expect(pass.primaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.secondaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.auxiliaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.headerFields).toBeInstanceOf(FieldsArray);
			expect(pass.backFields).toBeInstanceOf(FieldsArray);

			/** Resetting Fields, when setting type */
			pass.type = "generic";

			expect(pass.primaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.secondaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.auxiliaryFields).toBeInstanceOf(FieldsArray);
			expect(pass.headerFields).toBeInstanceOf(FieldsArray);
			expect(pass.backFields).toBeInstanceOf(FieldsArray);
		});
	});

	describe("type", () => {
		describe("getter", () => {
			it("should return undefined if no type have been setted", () => {
				expect(pass.type).toBeUndefined();
			});

			it("should return a type if set through pass.json", () => {
				pass.addBuffer(
					"pass.json",
					Buffer.from(
						JSON.stringify({
							boardingPass: {},
						}),
					),
				);

				expect(pass.type).toBe("boardingPass");
			});
		});

		describe("setter", () => {
			it("should throw error if a non recognized type is assigned", () => {
				expect(
					() =>
						// @ts-expect-error
						(pass.type = "asfdg"),
				).toThrow();
			});

			it("should save the new type under a Symbol in class instance", () => {
				pass.type = "boardingPass";
				expect(pass[passTypeSymbol]).toBe("boardingPass");
			});

			it("should reset fields if they have been previously set", () => {
				pass.type = "boardingPass";

				const {
					primaryFields,
					secondaryFields,
					auxiliaryFields,
					headerFields,
					backFields,
				} = pass;

				pass.type = "coupon";

				expect(pass.primaryFields).not.toBe(primaryFields);
				expect(pass.secondaryFields).not.toBe(secondaryFields);
				expect(pass.auxiliaryFields).not.toBe(auxiliaryFields);
				expect(pass.headerFields).not.toBe(headerFields);
				expect(pass.backFields).not.toBe(backFields);
			});

			it("should delete the previous type if previously setted", () => {
				pass.type = "boardingPass";
				pass.type = "coupon";

				expect(pass["boardingPass"]).toBeUndefined();
			});
		});
	});

	describe("localize", () => {
		it("should fail throw if lang is not a string", () => {
			// @ts-expect-error
			expect(() => pass.localize(null)).toThrowError(
				TypeError,
				Messages.LANGUAGES.INVALID_LANG.replace("%s", "object"),
			);

			// @ts-expect-error
			expect(() => pass.localize(undefined)).toThrowError(
				TypeError,
				Messages.LANGUAGES.INVALID_LANG.replace("%s", "undefined"),
			);

			// @ts-expect-error
			expect(() => pass.localize(5)).toThrowError(
				TypeError,
				Messages.LANGUAGES.INVALID_LANG.replace("%s", "number"),
			);

			// @ts-expect-error
			expect(() => pass.localize(true)).toThrowError(
				TypeError,
				Messages.LANGUAGES.INVALID_LANG.replace("%s", "boolean"),
			);

			// @ts-expect-error
			expect(() => pass.localize({})).toThrowError(
				TypeError,
				Messages.LANGUAGES.INVALID_LANG.replace("%s", "object"),
			);
		});

		it("should warn developer if no translations have been passed", () => {
			console.warn = jasmine.createSpy("log");
			// @ts-expect-error
			pass.localize("en");
			pass.localize("en", {});

			expect(console.warn).toHaveBeenCalledWith(
				Messages.LANGUAGES.NO_TRANSLATIONS.replace("%s", "en"),
			);

			expect(console.warn).toHaveBeenCalledTimes(2);
		});

		it("should create a new language record if some translations are specifies", () => {
			pass.localize("en", {
				buon_giorno: "Good Morning",
				buona_sera: "Good Evening",
			});

			expect(pass[localizationSymbol]["en"]).toEqual({
				buon_giorno: "Good Morning",
				buona_sera: "Good Evening",
			});
		});

		it("should accept later translations and merge them with existing ones", () => {
			pass.localize("it", {
				say_hi: "ciao",
				say_gb: "arrivederci",
			});

			pass.localize("it", {
				say_good_morning: "buongiorno",
				say_good_evening: "buonasera",
			});

			expect(pass[localizationSymbol]["it"]).toEqual({
				say_hi: "ciao",
				say_gb: "arrivederci",
				say_good_morning: "buongiorno",
				say_good_evening: "buonasera",
			});
		});

		it("should delete a language and its all translations when null is passed as parameter", () => {
			pass.localize("it", null);
			pass.localize("en", null);

			expect(pass[localizationSymbol]["it"]).toBeUndefined();
			expect(pass[localizationSymbol]["en"]).toBeUndefined();
		});

		it("should always return undefined", () => {
			expect(pass.localize("it", null)).toBeUndefined();
			expect(
				pass.localize("it", {
					say_good_morning: "buongiorno",
					say_good_evening: "buonasera",
				}),
			).toBeUndefined();
		});
	});

	describe("addBuffer", () => {
		it("should filter out silently manifest and signature files", () => {
			pass.addBuffer("manifest.json", Buffer.alloc(0));
			pass.addBuffer("signature", Buffer.alloc(0));

			expect(Object.keys(pass[filesSymbol]).length).toBe(0);
		});

		it("should accept a pass.json only if not yet imported", () => {
			pass.addBuffer(
				"pass.json",
				Buffer.from(
					JSON.stringify({
						boardingPass: {},
						serialNumber: "555555",
					}),
				),
			);

			expect(Object.keys(pass[filesSymbol]).length).toBe(1);

			/** Adding it again */

			pass.addBuffer(
				"pass.json",
				Buffer.from(
					JSON.stringify({
						boardingPass: {},
						serialNumber: "555555",
					}),
				),
			);

			/** Expecting it to get ignored */
			expect(Object.keys(pass[filesSymbol]).length).toBe(1);
		});

		it("should accept personalization.json only if it is a valid JSON", () => {
			pass.addBuffer(
				"personalization.json",
				Buffer.from(
					JSON.stringify({
						description:
							"A test description for a test personalization",
						requiredPersonalizationFields: [
							"PKPassPersonalizationFieldName",
							"PKPassPersonalizationFieldPostalCode",
							"PKPassPersonalizationFieldEmailAddress",
						],
					}),
				),
			);

			expect(pass[filesSymbol]["personalization.json"]).toBeInstanceOf(
				Buffer,
			);
		});

		it("should reject invalid personalization.json", () => {
			pass.addBuffer(
				"personalization.json",
				Buffer.from(
					JSON.stringify({
						requiredPersonalizationFields: [
							"PKPassPersonalizationFieldName",
							"PKPassPersonalizationFieldEmailAddressaworng",
						],
					}),
				),
			);

			expect(pass[filesSymbol]["personalization.json"]).toBeUndefined(
				Buffer,
			);
		});

		it("should redirect .strings files to localization", () => {
			const validTranslationStrings = `
/* Insert Element menu item */
"Insert Element" = "Insert Element";
/* Error string used for unknown error types. */
"ErrorString_1" = "An unknown error occurred.";
			`;

			pass.addBuffer(
				"en.lproj/pass.strings",
				Buffer.from(validTranslationStrings),
			);

			expect(pass[filesSymbol]["en.lproj/pass.string"]).toBeUndefined();
			expect(pass[localizationSymbol]["en"]).toEqual({
				"Insert Element": "Insert Element",
				ErrorString_1: "An unknown error occurred.",
			});
		});

		it("should ignore invalid .strings files", () => {
			const invalidTranslationStrings = `
"Insert Element"="Insert Element
"ErrorString_1= "An unknown error occurred."
			`;

			pass.addBuffer(
				"en.lproj/pass.strings",
				Buffer.from(invalidTranslationStrings),
			);

			expect(pass[filesSymbol]["en.lproj/pass.string"]).toBeUndefined();
			expect(pass[localizationSymbol]["en"]).toBeUndefined();
		});
	});

	describe("[importMetadataSymbol]", () => {
		it("should read data and set type", () => {
			pass[importMetadataSymbol]({
				boardingPass: {},
			});

			expect(pass.type).toBe("boardingPass");
		});

		it("should push fields to their own fields if a type is found", () => {
			const baseField: PassProps["boardingPass"]["headerFields"][0] = {
				key: "0",
				value: "n/a",
				label: "n/d",
			};

			pass[importMetadataSymbol]({
				boardingPass: {
					primaryFields: [{ ...baseField, key: "pf0" }],
					secondaryFields: [{ ...baseField, key: "sf0" }],
					auxiliaryFields: [{ ...baseField, key: "af0" }],
					headerFields: [{ ...baseField, key: "hf0" }],
					backFields: [{ ...baseField, key: "bf0" }],
				},
			} as PassProps);

			expect(pass.primaryFields[0]).toEqual({ ...baseField, key: "pf0" });
			expect(pass.secondaryFields[0]).toEqual({
				...baseField,
				key: "sf0",
			});
			expect(pass.auxiliaryFields[0]).toEqual({
				...baseField,
				key: "af0",
			});
			expect(pass.headerFields[0]).toEqual({ ...baseField, key: "hf0" });
			expect(pass.backFields[0]).toEqual({ ...baseField, key: "bf0" });
		});
	});

	describe("[closePassSymbol]", () => {
		beforeEach(() => {
			pass.addBuffer(
				"pass.json",
				Buffer.from(
					JSON.stringify({
						coupon: {
							headerFields: [],
							primaryFields: [],
							auxiliaryFields: [],
							secondaryFields: [],
							backFields: [],
						},
						serialNumber: "h12kj5b12k3331",
					} as PassProps),
				),
			);
		});

		it("should add props to pass.json", () => {
			pass.setBarcodes({
				format: "PKBarcodeFormatQR",
				message: "meh a test barcode",
			});

			pass.addBuffer("icon@2x.png", Buffer.alloc(0));

			pass[closePassSymbol](true);

			expect(
				JSON.parse(pass[filesSymbol]["pass.json"].toString("utf-8")),
			).toEqual({
				coupon: {
					headerFields: [],
					primaryFields: [],
					auxiliaryFields: [],
					secondaryFields: [],
					backFields: [],
				},
				serialNumber: "h12kj5b12k3331",
				barcodes: [
					{
						format: "PKBarcodeFormatQR",
						message: "meh a test barcode",
						messageEncoding: "iso-8859-1",
					},
				],
			});
		});

		it("Should warn user if no icons have been added to bundle", () => {
			console.warn = jasmine.createSpy("log");
			pass[closePassSymbol](true);

			expect(console.warn).toHaveBeenCalledWith(
				"At least one icon file is missing in your bundle. Your pass won't be openable by any Apple Device.",
			);
		});

		it("should create back again pass.strings files", () => {
			pass.localize("it", {
				home: "casa",
				ciao: "hello",
				cosa: "thing",
			});

			pass[closePassSymbol](true);

			expect(pass[filesSymbol]["it.lproj/pass.strings"].length).not.toBe(
				0,
			);
		});

		it("should remove all personalisation if requirements are not met", () => {
			pass.addBuffer(
				"personalization.json",
				Buffer.from(
					JSON.stringify({
						description:
							"A test description for a test personalization",
						requiredPersonalizationFields: [
							"PKPassPersonalizationFieldName",
							"PKPassPersonalizationFieldPostalCode",
							"PKPassPersonalizationFieldEmailAddress",
						],
					}),
				),
			);

			pass.addBuffer("personalizationLogo@2x.png", Buffer.alloc(0));

			pass[closePassSymbol](true);

			/** Pass is missing nfc data. */
			expect(pass[filesSymbol]["personalization.json"]).toBeUndefined();
			expect(
				pass[filesSymbol]["personalizationLogo@2x.png"],
			).toBeUndefined();

			/** Next: pass will miss personalizationLogo */

			pass.addBuffer(
				"personalization.json",
				Buffer.from(
					JSON.stringify({
						description:
							"A test description for a test personalization",
						requiredPersonalizationFields: [
							"PKPassPersonalizationFieldName",
							"PKPassPersonalizationFieldPostalCode",
							"PKPassPersonalizationFieldEmailAddress",
						],
					}),
				),
			);

			pass.setNFC({
				message: "nfc-encrypted-message",
				encryptionPublicKey: "none",
			});

			pass[closePassSymbol](true);

			expect(pass[filesSymbol]["personalization.json"]).toBeUndefined();
			expect(
				pass[filesSymbol]["personalizationLogo@2x.png"],
			).toBeUndefined();
		});

		it("should throw if no pass type have specified", () => {
			pass.type = undefined; /** reset */

			expect(() => pass[closePassSymbol](true)).toThrowError(
				TypeError,
				Messages.CLOSE.MISSING_TYPE,
			);
		});

		it("should throw if a boarding pass is exported without a transitType", () => {
			pass.type = "boardingPass";

			expect(() => pass[closePassSymbol](true)).toThrowError(
				TypeError,
				Messages.CLOSE.MISSING_TRANSIT_TYPE,
			);
		});
	});

	describe("[static] from", () => {
		it("should throw if source is unavailable", async () => {
			await expectAsync(
				// @ts-expect-error
				PKPass.from(),
			).toBeRejectedWithError(
				TypeError,
				Messages.FROM.MISSING_SOURCE.replace("%s", "undefined"),
			);

			await expectAsync(PKPass.from(null)).toBeRejectedWithError(
				TypeError,
				Messages.FROM.MISSING_SOURCE.replace("%s", "null"),
			);
		});

		describe("Prebuilt PKPass", () => {
			it("should copy all source's buffers into current one", async () => {
				pass.addBuffer(
					"index@2x.png",
					Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]),
				);

				const newPass = await PKPass.from(pass);

				expect(
					newPass[filesSymbol]["index@2x.png"].equals(
						pass[filesSymbol]["index@2x.png"],
					),
				).toBe(true);
				expect(newPass[filesSymbol]["index@2x.png"]).not.toBe(
					pass[filesSymbol]["index@2x.png"],
				);
			});

			it("should accept additional properties to be added to new buffer and ignore unknown props", async () => {
				const newPass = await PKPass.from(pass, {
					description: "mimmoh",
					serialNumber: "626621523738123",
					// @ts-expect-error
					insert_here_invalid_unknown_parameter_name: false,
				});

				expect(newPass[propsSymbol]["description"]).toBe("mimmoh");
				expect(newPass[propsSymbol]["serialNumber"]).toBe(
					"626621523738123",
				);
				expect(
					newPass[propsSymbol][
						"insert_here_invalid_unknown_parameter_name"
					],
				).toBeUndefined();
			});
		});

		describe("Template", () => {
			it("should reject invalid templates", async () => {
				await Promise.all([
					expectAsync(
						// @ts-expect-error
						PKPass.from(5),
					).toBeRejected(),
					expectAsync(
						// @ts-expect-error
						PKPass.from({}),
					).toBeRejected(),
					expectAsync(
						/** Missing certificates error */
						// @ts-expect-error
						PKPass.from({ model: "" }),
					).toBeRejected(),
					expectAsync(
						/** Missing model error */
						// @ts-expect-error
						PKPass.from({ certificates: {} }),
					).toBeRejected(),
					expectAsync(
						// @ts-expect-error
						PKPass.from(""),
					).toBeRejected(),
					expectAsync(
						// @ts-expect-error
						PKPass.from(true),
					).toBeRejected(),
					expectAsync(
						// @ts-expect-error
						PKPass.from([]),
					).toBeRejected(),
				]);
			});

			it("should read model from fileSystem and props", async () => {
				const footerFile = await fs.readFile(
					path.resolve(
						__dirname,
						"../examples/models/exampleBooking.pass/footer.png",
					),
				);

				const newPass = await PKPass.from(
					{
						model: path.resolve(
							__dirname,
							"../examples/models/exampleBooking.pass",
						),
						certificates: {
							...baseCerts,
						},
					},
					{
						voided: true,
					},
				);

				expect(Object.keys(newPass[filesSymbol]).length).toBe(7);

				expect(newPass[filesSymbol]["footer.png"]).not.toBeUndefined();
				expect(
					newPass[filesSymbol]["footer.png"].equals(footerFile),
				).toBe(true);
				expect(newPass[filesSymbol]["footer.png"]).not.toBe(footerFile);

				expect(newPass[propsSymbol]["voided"]).toBe(true);
			});
		});
	});

	describe("[static] pack", () => {
		beforeEach(() => {
			/** Bypass to avoid signature and manifest generation */
			pass[freezeSymbol]();
		});

		it("should should throw error if not all the files passed are PKPasses", () => {
			expect(
				// @ts-expect-error
				() => PKPass.pack(pass, "pass.json", pass),
			).toThrowError(Error, Messages.PACK.INVALID);
		});

		it("should output a frozen bundle of bundles", () => {
			const pkPassesBundle = PKPass.pack(pass, pass);

			expect(
				pkPassesBundle[filesSymbol]["packed-pass-1.pkpass"],
			).toBeInstanceOf(Buffer);
			expect(
				pkPassesBundle[filesSymbol]["packed-pass-2.pkpass"],
			).toBeInstanceOf(Buffer);

			expect(pkPassesBundle.isFrozen).toBe(true);
		});

		it("should output a bundle with pkpasses mimetype", () => {
			const pkPassesBundle = PKPass.pack(pass, pass);

			expect(pkPassesBundle.mimeType).toBe(
				"application/vnd.apple.pkpasses",
			);
		});
	});
});
