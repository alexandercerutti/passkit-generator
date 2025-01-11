import { Stream } from "node:stream";
import { Buffer } from "node:buffer";
import path from "node:path";
import FieldsArray from "./FieldsArray.js";
import Bundle, { filesSymbol } from "./Bundle.js";
import getModelFolderContents from "./getModelFolderContents.js";
import * as Schemas from "./schemas/index.js";
import * as Signature from "./Signature.js";
import * as Strings from "./StringsUtils.js";
import * as Utils from "./utils.js";
import * as Messages from "./messages.js";

const propsSymbol = Symbol("props");
const localizationSymbol = Symbol("pass.l10n");
const importMetadataSymbol = Symbol("import.pass.metadata");
const createManifestSymbol = Symbol("pass.manifest");
const closePassSymbol = Symbol("pass.close");
const passTypeSymbol = Symbol("pass.type");
const certificatesSymbol = Symbol("pass.certificates");

const RegExps = {
	PASS_JSON: /pass\.json/,
	MANIFEST_OR_SIGNATURE: /manifest|signature/,
	PERSONALIZATION: {
		JSON: /personalization\.json/,
		LOGO: /personalizationLogo@(?:.{2})/,
	} as const,
	PASS_STRINGS: /(?<lang>[a-zA-Z-]{2,}).lproj\/pass\.strings/,
	PASS_ICON: /icon(?:@\d{1}x)?/,
} as const;

export default class PKPass extends Bundle {
	private [certificatesSymbol]: Schemas.CertificatesSchema;
	private [propsSymbol]: Schemas.PassProps = {};
	private [localizationSymbol]: {
		[lang: string]: {
			[placeholder: string]: string;
		};
	} = {};
	private [passTypeSymbol]: Schemas.PassTypesProps | undefined = undefined;

	/**
	 * Either create a pass from another one
	 * or a disk path.
	 *
	 * @param source
	 * @returns
	 */

	public static async from<S extends PKPass | Schemas.Template>(
		source: S,
		props?: Schemas.OverridablePassProps,
	): Promise<PKPass> {
		let certificates: Schemas.CertificatesSchema | undefined = undefined;
		let buffers: Schemas.FileBuffers | undefined = undefined;

		if (!source) {
			throw new TypeError(
				Messages.format(Messages.FROM.MISSING_SOURCE, source),
			);
		}

		if (source instanceof PKPass) {
			/** Cloning is happening here */
			certificates = source[certificatesSymbol];
			buffers = {};

			const buffersEntries = Object.entries(source[filesSymbol]);

			/** Cloning all the buffers to prevent unwanted edits */
			for (let i = 0; i < buffersEntries.length; i++) {
				const [fileName, contentBuffer] = buffersEntries[i];

				buffers[fileName] = Buffer.alloc(contentBuffer.length);
				contentBuffer.copy(buffers[fileName]);
			}

			/**
			 * Moving props to pass.json instead of overrides
			 * because many might get excluded when passing
			 * through validation
			 */

			buffers["pass.json"] = Buffer.from(
				JSON.stringify(source[propsSymbol]),
			);
		} else {
			Schemas.assertValidity(
				Schemas.Template,
				source,
				Messages.TEMPLATE.INVALID,
			);

			buffers = await getModelFolderContents(source.model);
			certificates = source.certificates;
		}

		return new PKPass(buffers, certificates, props);
	}

	/**
	 * Creates a Bundle made of PKPass to be distributed
	 * as a `.pkpasses` zip file. Returns a Bundle instance
	 * so it can be outputted both as stream or as a buffer.
	 *
	 * Using this will freeze all the instances passed as
	 * parameter.
	 *
	 * Throws if not all the files are instance of PKPass.
	 *
	 * @param passes
	 */

	public static pack(...passes: PKPass[]): Bundle {
		const [bundle, freezeBundle] = Bundle.freezable(
			"application/vnd.apple.pkpasses",
		);

		for (let i = 0; i < passes.length; i++) {
			const pass = passes[i];

			if (!(pass instanceof PKPass)) {
				throw new Error(Messages.PACK.INVALID);
			}

			bundle.addBuffer(`packed-pass-${i + 1}.pkpass`, pass.getAsBuffer());
		}

		freezeBundle();

		return bundle;
	}

	// **************** //
	// *** INSTANCE *** //
	// **************** //

	public constructor(
		buffers?: Schemas.FileBuffers,
		certificates?: Schemas.CertificatesSchema,
		props?: Schemas.OverridablePassProps,
	) {
		super("application/vnd.apple.pkpass");

		if (buffers && typeof buffers === "object") {
			const buffersEntries = Object.entries(buffers);

			for (
				let i = buffersEntries.length, buffer: [string, Buffer];
				(buffer = buffersEntries[--i]);

			) {
				const [fileName, contentBuffer] = buffer;
				this.addBuffer(fileName, contentBuffer);
			}
		} else {
			console.warn(
				Messages.format(Messages.INIT.INVALID_BUFFERS, typeof buffers),
			);
		}

		if (props) {
			/** Overrides validation and pushing in props */
			const overridesValidation = Schemas.validate(
				Schemas.OverridablePassProps,
				props,
			);

			Object.assign(this[propsSymbol], overridesValidation);
		}

		if (certificates) {
			this.certificates = certificates;
		}
	}

	/**
	 * Allows changing the certificates, if needed.
	 * They are actually expected to be received in
	 * the constructor, but they can get overridden
	 * here for whatever purpose.
	 *
	 * When using this setter, all certificates are
	 * expected to be received, or an exception will
	 * be thrown.
	 *
	 * @param certs
	 */

	public set certificates(certs: Schemas.CertificatesSchema) {
		Utils.assertUnfrozen(this);

		Schemas.assertValidity(
			Schemas.CertificatesSchema,
			certs,
			Messages.CERTIFICATES.INVALID,
		);

		this[certificatesSymbol] = certs;
	}

	/**
	 * Allows retrieving current languages
	 */

	public get languages() {
		return Object.keys(this[localizationSymbol]);
	}

	/**
	 * Allows getting an image of the props
	 * that are composing your pass instance.
	 */

	public get props(): Schemas.PassProps {
		return Utils.cloneRecursive(this[propsSymbol]);
	}

	/**
	 * Allows accessing to iOS 18 new Event Ticket
	 * property `preferredStyleSchemes`.
	 *
	 * @throws if current type is not "eventTicket".
	 */

	public get preferredStyleSchemes(): Schemas.PreferredStyleSchemes {
		if (this.type !== "eventTicket") {
			throw new TypeError(
				Messages.PREFERRED_STYLE_SCHEMES.UNEXPECTED_PASS_TYPE_GET,
			);
		}

		return this[propsSymbol].preferredStyleSchemes;
	}

	/**
	 * Allows setting a preferredStyleSchemes property
	 * for a eventTicket.
	 *
	 * @throws if current type is not "eventTicket".
	 * @param value
	 */

	public set preferredStyleSchemes(value: Schemas.PreferredStyleSchemes) {
		Utils.assertUnfrozen(this);

		if (this.type !== "eventTicket") {
			throw new TypeError(
				Messages.PREFERRED_STYLE_SCHEMES.UNEXPECTED_PASS_TYPE_SET,
			);
		}

		Schemas.assertValidity(
			Schemas.PreferredStyleSchemes,
			value,
			Messages.PREFERRED_STYLE_SCHEMES.INVALID,
		);

		this[propsSymbol].preferredStyleSchemes = value;
	}

	/**
	 * Allows setting a transitType property
	 * for a boardingPass.
	 *
	 * @throws if current type is not "boardingPass".
	 * @param value
	 */

	public set transitType(value: Schemas.TransitType) {
		Utils.assertUnfrozen(this);

		if (this.type !== "boardingPass") {
			throw new TypeError(Messages.TRANSIT_TYPE.UNEXPECTED_PASS_TYPE);
		}

		Schemas.assertValidity(
			Schemas.TransitType,
			value,
			Messages.TRANSIT_TYPE.INVALID,
		);

		this[propsSymbol]["boardingPass"].transitType = value;
	}

	/**
	 * Allows getting the current transitType
	 * from pass props.
	 *
	 * @throws (automatically) if current type is not "boardingPass".
	 */

	public get transitType() {
		return this[propsSymbol]["boardingPass"].transitType;
	}

	/**
	 * Allows accessing to primaryFields object.
	 *
	 * @throws (automatically) if no valid pass.json
	 * 		has been parsed yet or, anyway, if current
	 * 		instance has not a valid type set yet.
	 */

	public get primaryFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].primaryFields;
	}

	/**
	 * Allows accessing to secondaryFields object
	 *
	 * @throws (automatically) if no valid pass.json
	 * 		has been parsed yet or, anyway, if current
	 * 		instance has not a valid type set yet.
	 */

	public get secondaryFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].secondaryFields;
	}

	/**
	 * Allows accessing to auxiliaryFields object
	 *
	 * For Typescript users: this signature allows
	 * in any case to add the 'row' field, but on
	 * runtime they are only allowed on "eventTicket"
	 * passes.
	 *
	 * @throws (automatically) if no valid pass.json
	 * 		has been parsed yet or, anyway, if current
	 * 		instance has not a valid type set yet.
	 */

	public get auxiliaryFields(): Schemas.FieldWithRow[] {
		return this[propsSymbol][this.type].auxiliaryFields;
	}

	/**
	 * Allows accessing to headerFields object
	 *
	 * @throws (automatically) if no valid pass.json
	 * 		has been parsed yet or, anyway, if current
	 * 		instance has not a valid type set yet.
	 */

	public get headerFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].headerFields;
	}

	/**
	 * Allows accessing to backFields object
	 *
	 * @throws (automatically) if no valid pass.json
	 * 		has been parsed yet or, anyway, if current
	 * 		instance has not a valid type set yet.
	 */

	public get backFields(): Schemas.Field[] {
		return this[propsSymbol][this.type].backFields;
	}

	/**
	 * Allows accessing to new iOS 18
	 * event ticket additional fields
	 *
	 * @throws (automatically) if no valid pass.json
	 * 		has been parsed yet or, anyway, if current
	 *		type is not "eventTicket".
	 */

	public get additionalInfoFields(): Schemas.Field[] {
		return this[propsSymbol]["eventTicket"].additionalInfoFields;
	}

	/**
	 * Allows setting a pass type.
	 *
	 * **Warning**: setting a type with this setter,
	 * will reset all the fields (primaryFields,
	 * secondaryFields, headerFields, auxiliaryFields, backFields),
	 * both imported or manually set.
	 */

	public set type(nextType: Schemas.PassTypesProps | undefined) {
		Utils.assertUnfrozen(this);

		Schemas.assertValidity(
			Schemas.PassType,
			nextType,
			Messages.PASS_TYPE.INVALID,
		);

		/** Shut up, typescript strict mode! */
		const type = nextType as Schemas.PassTypesProps;

		if (this.type) {
			/**
			 * Removing reference to previous type and its content because
			 * we might have some differences between types. It is way easier
			 * to reset everything instead of making checks.
			 */

			this[propsSymbol][this.type] = undefined;
			this[propsSymbol].preferredStyleSchemes = undefined;
		}

		const sharedKeysPool = new Set<string>();

		this[passTypeSymbol] = type;
		this[propsSymbol][type] = {
			headerFields /******/: new FieldsArray(
				this,
				sharedKeysPool,
				Schemas.Field,
			),
			primaryFields /*****/: new FieldsArray(
				this,
				sharedKeysPool,
				Schemas.Field,
			),
			secondaryFields /***/: new FieldsArray(
				this,
				sharedKeysPool,
				Schemas.Field,
			),
			auxiliaryFields /***/: new FieldsArray(
				this,
				sharedKeysPool,
				type === "eventTicket" ? Schemas.FieldWithRow : Schemas.Field,
			),
			backFields /********/: new FieldsArray(
				this,
				sharedKeysPool,
				Schemas.Field,
			),
			additionalInfoFields: new FieldsArray(
				this,
				sharedKeysPool,
				Schemas.Field,
			),
			transitType: undefined,
		};
	}

	public get type(): Schemas.PassTypesProps | undefined {
		return this[passTypeSymbol] ?? undefined;
	}

	// **************************** //
	// *** ASSETS SETUP METHODS *** //
	// **************************** //

	/**
	 * Allows adding a new asset inside the pass / bundle with
	 * the following exceptions:
	 *
	 * - Empty buffers are ignored;
	 * - `manifest.json` and `signature` files will be ignored;
	 * - `pass.json` will be read validated and merged in the
	 * 	current instance, if it wasn't added previously.
	 * 	It's properties will overwrite the instance ones.
	 * 	You might loose data;
	 * - `pass.strings` files will be read, parsed and merged
	 * 	with the current translations. Comments will be ignored;
	 * - `personalization.json` will be read, validated and added.
	 * 	They will be stripped out when exporting the pass if
	 * 	it won't have NFC details or if any of the personalization
	 * 	files is missing;
	 *
	 * @param pathName
	 * @param buffer
	 */

	public addBuffer(pathName: string, buffer: Buffer): void {
		if (!buffer?.length) {
			return;
		}

		if (RegExps.MANIFEST_OR_SIGNATURE.test(pathName)) {
			return;
		}

		if (RegExps.PASS_JSON.test(pathName)) {
			if (this[filesSymbol]["pass.json"]) {
				/**
				 * Ignoring any further addition. In a
				 * future we might consider merging instead
				 */
				return;
			}

			try {
				this[importMetadataSymbol](
					validateJSONBuffer(buffer, Schemas.PassProps),
				);
			} catch (err) {
				console.warn(
					Messages.format(Messages.PASS_SOURCE.INVALID, err),
				);
				return;
			}

			/**
			 * Adding an empty buffer just for reference
			 * that we received a valid pass.json file.
			 * It will be reconciliated in export phase.
			 */

			return super.addBuffer(pathName, Buffer.alloc(0));
		}

		if (RegExps.PERSONALIZATION.JSON.test(pathName)) {
			/**
			 * We are still allowing `personalizationLogo@XX.png`
			 * to be added to the bundle, but we'll delete it
			 * once the pass is getting closed, if needed.
			 */

			try {
				validateJSONBuffer(buffer, Schemas.Personalize);
			} catch (err) {
				console.warn(
					Messages.format(Messages.PERSONALIZE.INVALID, err),
				);
				return;
			}

			return super.addBuffer(pathName, buffer);
		}

		/**
		 * Converting Windows path to Unix path
		 * @example de.lproj\\icon.png => de.lproj/icon.png
		 */

		const normalizedPathName = pathName.replace(path.sep, "/");

		/**
		 * If a new pass.strings file is added, we want to
		 * prevent it from being merged and, instead, save
		 * its translations for later
		 */

		let match: RegExpMatchArray | null;

		if ((match = normalizedPathName.match(RegExps.PASS_STRINGS))) {
			const [, lang] = match;

			const parsedTranslations = Strings.parse(buffer).translations;

			if (!parsedTranslations.length) {
				return;
			}

			this.localize(lang, Object.fromEntries(parsedTranslations));

			return;
		}

		return super.addBuffer(normalizedPathName, buffer);
	}

	/**
	 * Given data from a pass.json, reads them to bring them
	 * into the current pass instance.
	 *
	 * @param data
	 */

	private [importMetadataSymbol](data: Schemas.PassProps) {
		const possibleTypes = [
			"boardingPass",
			"coupon",
			"eventTicket",
			"storeCard",
			"generic",
		] as Schemas.PassTypesProps[];

		const type = possibleTypes.find((type) => Boolean(data[type]));

		const {
			boardingPass,
			coupon,
			storeCard,
			generic,
			eventTicket,
			...otherPassData
		} = data;

		if (Object.keys(this[propsSymbol]).length) {
			console.warn(Messages.PASS_SOURCE.JOIN);
		}

		Object.assign(this[propsSymbol], otherPassData);

		if (!type) {
			if (!this[passTypeSymbol]) {
				console.warn(Messages.PASS_SOURCE.UNKNOWN_TYPE);
			}
		} else {
			this.type = type;

			const {
				headerFields = [],
				primaryFields = [],
				secondaryFields = [],
				auxiliaryFields = [],
				backFields = [],
				transitType,
				additionalInfoFields = [],
			} = data[type] || {};

			this.headerFields.push(...headerFields);
			this.primaryFields.push(...primaryFields);
			this.secondaryFields.push(...secondaryFields);
			this.auxiliaryFields.push(...auxiliaryFields);
			this.backFields.push(...backFields);

			if (this.type === "boardingPass") {
				this.transitType = transitType;
			}

			if (this.type === "eventTicket") {
				this.additionalInfoFields.push(...additionalInfoFields);
			}
		}
	}

	/**
	 * Creates the manifest starting from files
	 * added to the bundle
	 */

	private [createManifestSymbol](): Buffer {
		const manifest = Object.entries(this[filesSymbol]).reduce<{
			[key: string]: string;
		}>(
			(acc, [fileName, buffer]) => ({
				...acc,
				[fileName]: Signature.createHash(buffer),
			}),
			{},
		);

		return Buffer.from(JSON.stringify(manifest));
	}

	/**
	 * Applies the last validation checks against props,
	 * applies the props to pass.json and creates l10n
	 * files and folders and creates manifest and
	 * signature files
	 */

	private [closePassSymbol]() {
		if (!this.type) {
			throw new TypeError(Messages.CLOSE.MISSING_TYPE);
		}

		const fileNames = Object.keys(this[filesSymbol]);

		const passJson = Buffer.from(JSON.stringify(this[propsSymbol]));
		super.addBuffer("pass.json", passJson);

		if (!fileNames.some((fileName) => RegExps.PASS_ICON.test(fileName))) {
			console.warn(Messages.CLOSE.MISSING_ICON);
		}

		// *********************************** //
		// *** LOCALIZATION FILES CREATION *** //
		// *********************************** //

		const localizationEntries = Object.entries(this[localizationSymbol]);

		for (let i = localizationEntries.length - 1; i >= 0; i--) {
			const [lang, translations] = localizationEntries[i];

			const stringsFile = Strings.create(translations);

			if (stringsFile.length) {
				super.addBuffer(`${lang}.lproj/pass.strings`, stringsFile);
			}
		}

		// *********************** //
		// *** PERSONALIZATION *** //
		// *********************** //

		const meetsPersonalizationRequirements = Boolean(
			this[propsSymbol]["nfc"] &&
				this[filesSymbol]["personalization.json"] &&
				fileNames.find((file) =>
					RegExps.PERSONALIZATION.LOGO.test(file),
				),
		);

		if (!meetsPersonalizationRequirements) {
			/**
			 * Looking for every personalization file
			 * and removing it
			 */

			for (let i = 0; i < fileNames.length; i++) {
				if (fileNames[i].includes("personalization")) {
					console.warn(
						Messages.format(
							Messages.CLOSE.PERSONALIZATION_REMOVED,
							fileNames[i],
						),
					);

					delete this[filesSymbol][fileNames[i]];
				}
			}
		}

		// ******************************** //
		// *** BOARDING PASS VALIDATION *** //
		// ******************************** //

		if (this.type === "boardingPass" && !this.transitType) {
			throw new TypeError(Messages.CLOSE.MISSING_TRANSIT_TYPE);
		}

		// ****************************** //
		// *** SIGNATURE AND MANIFEST *** //
		// ****************************** //

		const manifestBuffer = this[createManifestSymbol]();
		super.addBuffer("manifest.json", manifestBuffer);

		const signatureBuffer = Signature.create(
			manifestBuffer,
			this[certificatesSymbol],
		);
		super.addBuffer("signature", signatureBuffer);
	}

	// ************************* //
	// *** EXPORTING METHODS *** //
	// ************************* //

	/**
	 * Exports the pass as a zip buffer. When this method
	 * is invoked, the bundle will get frozen and, thus,
	 * no files will be allowed to be added any further.
	 *
	 * @returns
	 */

	public getAsBuffer(): Buffer {
		if (!this.isFrozen) {
			this[closePassSymbol]();
		}

		return super.getAsBuffer();
	}

	/**
	 * Exports the pass as a zip stream. When this method
	 * is invoked, the bundle will get frozen and, thus,
	 * no files will be allowed to be added any further.
	 *
	 * @returns
	 */

	public getAsStream(): Stream {
		if (!this.isFrozen) {
			this[closePassSymbol]();
		}

		return super.getAsStream();
	}

	/**
	 * Exports the pass as a list of file paths and buffers.
	 * When this method is invoked, the bundle will get
	 * frozen and, thus, no files will be allowed to be
	 * added any further.
	 *
	 * This allows developers to choose a different way
	 * of serving, analyzing or zipping the file, outside the
	 * default compression system.
	 *
	 * @returns a frozen object containing files paths as key
	 * 		and Buffers as content.
	 */

	public getAsRaw(): { [filePath: string]: Buffer } {
		if (!this.isFrozen) {
			this[closePassSymbol]();
		}

		return super.getAsRaw();
	}

	// ************************** //
	// *** DATA SETUP METHODS *** //
	// ************************** //

	/**
	 * Allows to add a localization details to the
	 * final bundle with some translations.
	 *
	 * If the language already exists, translations will be
	 * merged with the existing ones.
	 *
	 * Setting `translations` to `null` fully deletes a language,
	 * its translations and its files.
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/creating_the_source_for_a_pass#3736718
	 * @param lang
	 * @param translations
	 */

	public localize(
		lang: string,
		translations: { [key: string]: string } | null,
	) {
		Utils.assertUnfrozen(this);

		if (typeof lang !== "string") {
			throw new TypeError(
				Messages.format(Messages.LANGUAGES.INVALID_LANG, typeof lang),
			);
		}

		if (translations === null) {
			delete this[localizationSymbol][lang];

			const allFilesKeys = Object.keys(this[filesSymbol]);
			const langFolderIdentifier = `${lang}.lproj`;

			for (let i = allFilesKeys.length - 1; i >= 0; i--) {
				const filePath = allFilesKeys[i];

				if (filePath.startsWith(langFolderIdentifier)) {
					delete this[filesSymbol][filePath];
				}
			}

			return;
		}

		if (!translations || !Object.keys(translations).length) {
			console.warn(
				Messages.format(Messages.LANGUAGES.NO_TRANSLATIONS, lang),
			);
			return;
		}

		this[localizationSymbol][lang] ??= {};

		if (typeof translations === "object" && !Array.isArray(translations)) {
			Object.assign(this[localizationSymbol][lang], translations);
		}
	}

	/**
	 * Allows to specify an expiration date for the pass.
	 *
	 * Pass `null` to remove the expiration date.
	 *
	 * @param date
	 * @throws if pass is frozen due to previous export
	 * @returns
	 */

	public setExpirationDate(date: Date | null) {
		Utils.assertUnfrozen(this);

		if (date === null) {
			delete this[propsSymbol]["expirationDate"];
			return;
		}

		try {
			this[propsSymbol]["expirationDate"] = Utils.processDate(date);
		} catch (err) {
			throw new TypeError(
				Messages.format(Messages.DATE.INVALID, "expirationDate", date),
			);
		}
	}

	/**
	 * Allows setting some beacons the OS should
	 * react to and show this pass.
	 *
	 * Pass `null` to remove them at all.
	 *
	 * @example
	 * ```ts
	 *		PKPassInstance.setBeacons(null)
	 *		PKPassInstance.setBeacons({
	 *			proximityUUID: "00000-000000-0000-00000000000",
	 *		});
	 * ```
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/pass/beacons
	 * @param beacons
	 * @throws if pass is frozen due to previous export
	 * @returns
	 */

	public setBeacons(beacons: null): void;
	public setBeacons(...beacons: Schemas.Beacon[]): void;
	public setBeacons(...beacons: (Schemas.Beacon | null)[]) {
		Utils.assertUnfrozen(this);

		if (beacons[0] === null) {
			delete this[propsSymbol]["beacons"];
			return;
		}

		this[propsSymbol]["beacons"] = Schemas.filterValid(
			Schemas.Beacon,
			beacons as Schemas.Beacon[],
		);
	}

	/**
	 * Allows setting some locations the OS should
	 * react to and show this pass.
	 *
	 * Pass `null` to remove them at all.
	 *
	 * @example
	 * ```ts
	 *		PKPassInstance.setLocations(null)
	 *		PKPassInstance.setLocations({
	 *			latitude: 0.5333245342
	 *			longitude: 0.2135332252
	 *		});
	 * ```
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/pass/locations
	 * @param locations
	 * @throws if pass is frozen due to previous export
	 * @returns
	 */

	public setLocations(locations: null): void;
	public setLocations(...locations: Schemas.Location[]): void;
	public setLocations(...locations: (Schemas.Location | null)[]): void {
		Utils.assertUnfrozen(this);

		if (locations[0] === null) {
			delete this[propsSymbol]["locations"];
			return;
		}

		this[propsSymbol]["locations"] = Schemas.filterValid(
			Schemas.Location,
			locations as Schemas.Location[],
		);
	}

	/**
	 * Allows setting a series of relevancy intervals or
	 * relevancy entries for the pass.
	 *
	 * @param {Schemas.RelevantDate[] | null} relevancyEntries
	 * @returns {void}
	 */

	public setRelevantDates(
		relevancyEntries: Schemas.RelevantDate[] | null,
	): void {
		Utils.assertUnfrozen(this);

		if (relevancyEntries === null) {
			this[propsSymbol]["relevantDates"] = undefined;
			return;
		}

		const processedDateEntries = relevancyEntries.reduce<
			Schemas.RelevantDate[]
		>((acc, entry) => {
			try {
				Schemas.validate(Schemas.RelevantDate, entry);

				if (isRelevantEntry(entry)) {
					acc.push({
						relevantDate: Utils.processDate(
							new Date(entry.relevantDate),
						),
					});

					return acc;
				}

				acc.push({
					startDate: Utils.processDate(new Date(entry.startDate)),
					endDate: Utils.processDate(new Date(entry.endDate)),
				});
			} catch (err) {
				console.warn(new TypeError(Messages.RELEVANT_DATE.INVALID));
			}

			return acc;
		}, []);

		this[propsSymbol]["relevantDates"] = processedDateEntries;
	}

	/**
	 * Allows setting a relevant date in which the OS
	 * should show this pass.
	 *
	 * Pass `null` to remove relevant date from this pass.
	 *
	 * @param {Date | null} date
	 * @throws if pass is frozen due to previous export
	 *
	 * @warning `relevantDate` property has been deprecated in iOS 18
	 * in order to get replaced by `relevantDates` array of intervals
	 * (`relevantDates[].startDate` + `relevantDates[].endDate`)
	 * or single date (`relevantDates[].relevantDate`).
	 */

	public setRelevantDate(date: Date | null): void {
		Utils.assertUnfrozen(this);

		if (date === null) {
			delete this[propsSymbol]["relevantDate"];
			return;
		}

		try {
			this[propsSymbol]["relevantDate"] = Utils.processDate(date);
		} catch (err) {
			throw new TypeError(
				Messages.format(Messages.DATE.INVALID, "relevantDate", date),
			);
		}
	}

	/**
	 * Allows to specify some barcodes formats.
	 * As per the current specifications, only the first
	 * will be shown to the user, without any possibility
	 * to change it.
	 *
	 * It accepts either a string from which all formats will
	 * be generated or a specific set of barcodes objects
	 * to be validated and used.
	 *
	 * Pass `null` to remove all the barcodes.
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/pass/barcodes
	 * @param barcodes
	 * @throws if pass is frozen due to previous export
	 * @returns
	 */

	public setBarcodes(barcodes: null): void;
	public setBarcodes(message: string): void;
	public setBarcodes(...barcodes: Schemas.Barcode[]): void;
	public setBarcodes(...barcodes: (Schemas.Barcode | string | null)[]): void {
		Utils.assertUnfrozen(this);

		if (!barcodes.length) {
			return;
		}

		if (barcodes[0] === null) {
			delete this[propsSymbol]["barcodes"];
			return;
		}

		let finalBarcodes: Schemas.Barcode[];

		if (typeof barcodes[0] === "string") {
			/**
			 * A string has been received instead of objects. We can
			 * only auto-fill them all with the same data.
			 */

			const supportedFormats: Array<Schemas.BarcodeFormat> = [
				"PKBarcodeFormatQR",
				"PKBarcodeFormatPDF417",
				"PKBarcodeFormatAztec",
				"PKBarcodeFormatCode128",
			];

			finalBarcodes = supportedFormats.map((format) =>
				Schemas.validate(Schemas.Barcode, {
					format,
					message: barcodes[0],
				} as Schemas.Barcode),
			);
		} else {
			finalBarcodes = Schemas.filterValid(
				Schemas.Barcode,
				barcodes as Schemas.Barcode[],
			);
		}

		this[propsSymbol]["barcodes"] = finalBarcodes;
	}

	/**
	 * Allows to specify details to make this, an
	 * NFC-capable pass.
	 *
	 * Pass `null` as parameter to remove it at all.
	 *
	 * @see https://developer.apple.com/documentation/walletpasses/pass/nfc
	 * @param data
	 * @throws if pass is frozen due to previous export
	 * @returns
	 */

	public setNFC(nfc: Schemas.NFC | null): void {
		Utils.assertUnfrozen(this);

		if (nfc === null) {
			delete this[propsSymbol]["nfc"];
			return;
		}

		this[propsSymbol]["nfc"] =
			Schemas.validate(Schemas.NFC, nfc) ?? undefined;
	}
}

function validateJSONBuffer(
	buffer: Buffer,
	schema: Parameters<typeof Schemas.validate>[0],
): Schemas.PassProps {
	let contentAsJSON: Schemas.PassProps;

	try {
		contentAsJSON = JSON.parse(buffer.toString("utf8"));
	} catch (err) {
		throw new TypeError(Messages.JSON.INVALID);
	}

	return Schemas.validate(schema, contentAsJSON);
}

function isRelevantEntry(
	entry: Schemas.RelevantDate,
): entry is Schemas.RelevancyEntry {
	return Object.prototype.hasOwnProperty.call(entry, "relevantDate");
}
