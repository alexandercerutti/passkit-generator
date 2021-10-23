# API Reference

The flow of execution is really easy (once everything is set up):

-   You get your data from somewhere
-   You set the needed data in the pass through methods, props and data in fields
-   You generate the pass stream or buffer through respectively `.getAsStream()` or `.getAsBuffer()` methods
-   Hooray 😄🎉

Some details:

-   Properties will be checked against schemas, which are built to reflect Apple's specifications, that can be found on Apple Developer Portal, at [PassKit Package Format Reference](https://apple.co/2MUHsm0).

-   In case of troubleshooting, you can refer to the [Self-help](https://github.com/alexandercerutti/passkit-generator/wiki/Self-help) guide in Wiki or open an issue.

-   Keep this as it is always valid for the reference:

```javascript
const { PKPass } = require("passkit-generator");
```

---

## Creating a Pass

---

### constructor()

```typescript
const pass = new PKPass({ ... }, { ... }, { ... });
```

**Returns**:

`PKPass`

**Description**:

PKPass extends an internal class `Bundle`, which gives it some props. Only the exposed ones will be listed below.

**Arguments**:

| Key                              | Type             | Description                                                                                                                     | Optional | Default Value |
| -------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- | :------: | :-----------: |
| buffers                          | object           | The initial files buffers to compose a pass. They must be in form `path: Buffer`. Set to empty object if none is available yet. |  false   |       -       |
| certificates                     | object           | The certificates object.                                                                                                        |  false   |       -       |
| certificates.wwdr                | string \| Buffer | The content of Apple WWDR certificate.                                                                                          |  false   |       -       |
| certificates.signerCert          | string \| Buffer | The content of Developer certificate file.                                                                                      |  false   |       -       |
| certificates.signerKey           | string \| Buffer | The content of developer certificate's key.                                                                                     |  false   |       -       |
| certificates.signerKeyPassphrase | string           | The passphrase to decrypt the developer signerKey                                                                               |   true   |       -       |
| props                            | object           | Some pass props that will get merged with the ones in pass.json                                                                 |   true   |     `{ }`     |

<br><br>

---

### Creating a pass from another pass or from a template

A pass can be created through its constructor (creating from scratch) or from another pass or from a template. A "template" here is a model saved on disk. Both can be created by using the static method `PKPass.from()`.

```typescript
PKPass.from(source: PKPass | PKPass.Template, props?: Schemas.OverridableProps): Promise<typeof PKPass>;
```

Throws if pass source is not valid.

In both case, additional props can be passed as second parameter through an object.

Here below you can see few example functions that will be used in the following ways to use `PKPass.from`.

```typescript
function getAdditionalPropsForThisPassSomehow() {
	// get your additional props for THIS pass

	return {
		serialNumber: "12356222",
		/** moar props ... */
	};
}

function getSomeProps() {
	/** Set your base props for all your passes **/

	return {
		description: "Pass for some business activity",
		webServiceURL: "https://example.com/passkit",
		/** moar props ... */
	};
}

function getCertificatesSomehow() {
	return {
		signerCert: "" /** string or Buffer **/,
		signerKey: "" /** string or Buffer **/,
		wwdr: "" /** string or Buffer **/,
		signerKeyPassphrase: "" /** string **/,
	};
}
```

### Another Pass

**Description**:

Pass another `PKPass` as source of `PKPass.from` to make it clone every property and file in the source object (except manifest and signature).

This is useful if you want to create a runtime template with your buffers and then use always it as base.

**Example**:

```typescript
const passRuntimeTemplate = new PKPass(
	getBuffersSomehow(),
	getCertificatesSomehow(),
	getSomeProps(),
);

// later...

const passToBeServed = await PKPass.from(
	passRuntimeTemplate,
	getAdditionalPropsForThisPassSomehow(),
);
```

### A template

**Description**:

Use this is you have a saved model on your File System and want to read it and use it as source for your pass.

**Arguments**:

The following are the arguments to be passed in the object in first position:

| Key | Type | Description | Optional | Default Value |
| model | string (path) | The path to your model on File System | `false` | - |
| certificates | object | The object containing certificates data. Refer to PKPass's constructor for all the keys | `false` | - |

**Example**:

```typescript
const passFromDisk = await PKPass.from(
	{
		model: "../../path/to/your/disk/model",
		certificates: getCertificatesSomehow(),
	},
	getAdditionalPropsForThisPassSomehow(),
);
```

<br>

---

### Adding files to your pass

---

#### .addBuffer()

```typescript
pass.addBuffer(filePath: string, buffer: Buffer): void;
```

**Description**:

This method allows later additions of files to your pass. It has no filters about the type of file you may want to add but for:

-   `pass.json`
-   `personalization.json`
-   `\<lang\>.lproj/pass.strings`
-   `manifest.json`
-   `signature`

In these three cases, `addBuffer` will perform additional checks and might not add the file as is.

-   `pass.json` will be parsed and merged with current props **only if not already availble**. Otherwise it gets ignored. In case of merging, it might overwrite props you set first, through constructor or methods;
-   personalization.json will be parsed, validated and then added (only if valid);
-   `\<lang\>.lproj/pass.strings` will be parsed and, if valid, will be merged within the current translations;
-   `manifest` will be ignored;
-   `signature` will be ignored;

Throws if pass is frozen due to a previous export.

**Arguments**:

| Key | Type | Description | Optional | Default Value |
| filePath | string (path) | The path, local to your pass.json, where the file should be added (if it is a localization file, it will be like `en.lproj/pass.strings`, otherwise just the name, like `personalization.json`) | `false` | - |
| buffer | Buffer | The content of your file | `false` | - |

---

### Localizing Passes

---

According to Apple Developer Documentation, localization (L10N) is done by creating a `.lproj` folder for each language you want to translate your pass, each named with the relative [ISO-3166-1 alpha-2](https://it.wikipedia.org/wiki/ISO_3166-1_alpha-2) code (e.g. `en.lproj`).

There are three ways to include a language in this package:

-   By importing a localized buffer or a localized model when creating the instance;
-   By adding a file (media or pass.strings) for that specific language through `.addBuffer` method (like `.addBuffer("en.lproj/thumbnail@2x.png", Buffer.from([...]))`);
-   By specifying translations for a language through `.localize` method below;

> If you are designing your pass for a language only, you can directly replace the placeholders in `pass.json` with translation.

<br>

#### .localize()

```typescript
pass.localize(lang: string, translations: { [key: string]: string }): void;
```

**Returns**:

`void`

**Description**:

Use this method to add some translations.
Existing translations will be merged with the newly added.

Calling `.localize` is the same as calling `.addBuffer` for a `pass.strings` file, except parsing phase.
Pass `null` to translations param to delete **everything** of a language (translations and files).

Throws if pass is frozen due to a previous export, if the last is not a string or if no translations are provided.

**Arguments**:

| Key          | Type           | Description                                                                                                   | Optional | Default Value |
| ------------ | -------------- | ------------------------------------------------------------------------------------------------------------- | -------- | :-----------: |
| lang         | String         | The ISO-3166-1 language code                                                                                  | false    |       -       |
| translations | Object \| null | Translations in format `{ <PLACEHOLDER>: "TRANSLATED-VALUE"}`. Pass `null` to delete everything of a language | false    |       -       |

**Example**:

```typescript
pass.localize("it", {
	EVENT: "Evento",
	LOCATION: "Posizione",
});

pass.localize("de", {
	EVENT: "Ereignis",
	LOCATION: "Ort",
});
```

---

### Setting barcodes

---

#### .setBarcodes()

```typescript
pass.setBarcodes(message: string): void;
pass.setBarcodes(...barcodes: schema.Barcodes[]): void;
```

**Returns**:

`void`

**Description**:

Setting barcodes can happen in two ways: `controlled` and `uncontrolled` (autogenerated), which means how many [barcode structures](https://apple.co/2myAbst) you will have in your pass.

Passing a `string` to the method, will lead to an `uncontrolled` way: starting from the message (content), all the structures will be generated. Any further parameter will be ignored.

Passing _N_ barcode structures (see below), will only validate them and push only the valid ones.

Setting barcodes _will overwrite_ previously setted barcodes (no matter the source).
Pass `null` to delete all the barcodes.

Throws if pass is frozen due to a previous export.

> Please note that, as `barcode` property is deprecated, this is the only method available for setting barcodes.

**Arguments**:

| Key     | Type                  | Description              | Optional |
| ------- | --------------------- | ------------------------ | -------- |
| message | `String` \| `Barcode` | first value of barcodes  | false    |
| ...rest | `Barcode[]`           | the other barcode values | true     |

**Examples**:

```typescript
pass.setBarcodes("11424771526");

// or

pass.setBarcodes({
	message: "11424771526",
	format: "PKBarcodeFormatCode128"
	altText: "11424771526"
}, {
	message: "11424771526",
	format: "PKBarcodeFormatQR"
	altText: "11424771526"
}, {
	message: "11424771526",
	format: "PKBarcodeFormatPDF417"
	altText: "11424771526"
});
```

**See**: [PassKit Package Format Reference # Barcode Dictionary](https://developer.apple.com/documentation/walletpasses/pass/barcodes)

<br>
<br>

---

### Setting expiration

---

#### .setExpirationDate()

```typescript
pass.setExpirationDate(date: Date): void;
```

**Returns**:

`void`

**Description**:

It sets the date of expiration to the passed argument.
Pass `null` as the parameter to remove the value from props.
If date parsing fails, an error will be thrown.

Throws if pass is frozen due to a previous export.

**Arguments**:

| Key  | Type        | Description                            | Optional |
| ---- | ----------- | -------------------------------------- | -------- |
| date | String/date | The date on which the pass will expire | false    |

---

### Setting relevance

---

#### .setBeacons()

```typescript
pass.setBeacons(...data: schema.Beacons[]): void;
```

**Returns**:

`void`

**Description**:

Sets the beacons information in the passes.
Setting beacons _will overwrite_ previously setted beacons.
Pass `null` to delete all the beacons.

Throws if pass is frozen due to a previous export.

**Arguments**:

| Key        | Type                                                                                       | Description            | Optional | Default Value |
| ---------- | ------------------------------------------------------------------------------------------ | ---------------------- | -------- | :-----------: |
| ...beacons | [Beacons[]](https://developer.apple.com/documentation/walletpasses/pass/beacons) \| `null` | The beacons structures | false    |       -       |

**Example**:

```typescript
pass.setBeacons(
	{
		major: 55,
		minor: 0,
		proximityUUID: "59da0f96-3fb5-43aa-9028-2bc796c3d0c5",
	},
	{
		major: 65,
		minor: 46,
		proximityUUID: "fdcbbf48-a4ae-4ffb-9200-f8a373c5c18e",
	},
);
```

---

#### .setLocations()

```typescript
pass.setLocations(...data: schema.Locations[]): void;
```

**Returns**:

`void`

**Description**:

Sets the location-relevance information in the passes.
Setting locations _will overwrite_ previously setted locations (no matter the source).
Pass `null` to delete all the locations.

Throws if pass is frozen due to a previous export.

**Arguments**:

| Key          | Type                                                                                                  | Description             | Optional | Default Value |
| ------------ | ----------------------------------------------------------------------------------------------------- | ----------------------- | -------- | :-----------: |
| ...locations | [schema.Locations[]](https://developer.apple.com/documentation/walletpasses/pass/locations) \| `null` | The location structures | false    |       -       |

**Example**:

```typescript
pass.setLocations(
	{
		latitude: 66.45725212,
		longitude: 33.01000442,
	},
	{
		longitude: 4.42634523,
		latitude: 5.344233323352,
	},
);
```

<br>
<hr>

#### .setRelevantDate()

```typescript
pass.setRelevantDate(date: Date): void;
```

**Returns**:

`void`

**Description**:

It sets the date of relevance to the passed argument.
Pass `null` as the parameter to remove the value from props.
If date parsing fails, an error will be thrown.

Throws if pass is frozen due to a previous export.

**Arguments**:

| Key  | Type           | Description       | Optional | Default Value |
| ---- | -------------- | ----------------- | -------- | :-----------: |
| date | Date \| `null` | The relevant date | false    |       -       |

---

### Setting NFC Support

---

#### .setNFC()

```typescript
pass.setNFC(data: schema.NFC): void
```

**Returns**:

`void`

**Description**:

It sets NFC info for the current pass.
Pass `null` as parameter to remove its value from props.

Throws if pass is frozen due to a previous export or if parameter validation fails.

**Arguments**:

| Key  | Type                                                                             | Description   | Optional |
| ---- | -------------------------------------------------------------------------------- | ------------- | -------- |
| data | [NFC](https://developer.apple.com/documentation/walletpasses/pass/nfc) \| `null` | NFC structure | false    |

---

#### Personalization / Reward Enrollment passes

Personalization (or [Reward Enrollment](https://apple.co/2YkS12N) passes) is supported only if `personalization.json` is available and has it's a valid json file with valid (recognized) props, `personalizationLogo@XX.png` (where 'XX' => x2, x3) is available, and if NFC is setted.

If these conditions are not met, the personalization will get removed from the output pass or not accepted as input file.

> _Notice_: **I had the possibility to test in no way this feature on any real pass 'cause Apple would never give me an encryptionKey for NFC. Also I don't have an NFC reader. If you need it and this won't work, feel free to contact me and we will investigate together 😄**

---

### Setting Pass Fields (primaryFields, secondaryFields, headerFields, auxiliaryFields, backFields)

---

Unlike method-set properties or initialization props, to set fields inside the right property, some getters have been created, one per property. Each extends native Arrays, to let you perform all the operations you need on the fields. Fields already available in pass.json, will be automatically loaded in props.

Please note that they are strictly and directly linked to the pass type property (boardingPass, storeCard, etc...).
This means that **if pass type is not available, accessing them will throw an error**.
Changing the type on runtime will clean all them up.

All the fields are linked together through a keys pool: each key must be unique among **all** the fields of the whole pass.

Each getter will throw if pass is frozen due to a previous export, when a new element is attempted to be added to the related array.

**Examples:**

```javascript
pass.headerFields.push(
	{
		key: "header1",
		label: "Data",
		value: "25 mag",
		textAlignment: "PKTextAlignmentCenter",
	},
	{
		key: "header2",
		label: "Volo",
		value: "EZY997",
		textAlignment: "PKTextAlignmentCenter",
	},
);
pass.primaryFields.pop();
pass.auxiliaryFields.push(/*...*/);
pass.secondaryFields.push(/*...*/);
pass.backFields.push(/*...*/);
```

**See**: [Passkit Package Format Reference # Field Dictionary Keys](https://developer.apple.com/documentation/walletpasses/passfields)

---

#### .transitType (getter + setter)

```typescript
pass.transitType = "PKTransitTypeAir";
```

**Description**:

Since this property belongs to the "Field Keys" but is not an "array of field dictionaries" like the sibling keys, a setter and a getter got included to select it.

Allowed values: **PKTransitTypeAir**, **PKTransitTypeBoat**, **PKTransitTypeBus**, **PKTransitTypeGeneric**, **PKTransitTypeTrain**", as described in Passkit Package Format Reference.

Please note that it is strictly and directly linked to the pass type property (only boardingPass).

This means that **if pass type is not available or is not a boardingPass, accessing or setting it will throw an error**.
Changing the type on runtime will clean it up.

Pass exporting will throw an error if a boardingPass is exported without `transitType`.

Setter throws if pass is frozen due to a previous export, if an invalid pass type is invalid, or if current type is not a `boardingPass`.

---

### Getting the signed Pass

---

Generating the pass is the last step of the process (before enjoying 🎉).
Generating might happen in three ways: getting a Buffer, a Stream or Raw files.

**All the three ways available, will lock the pass instance to not accept anymore files or props.**

---

#### .getAsBuffer()

```typescript
pass.getAsBuffer(): Buffer;
```

**Description**:

Creates a buffer of the zipped pass. This is useful when passkit-generator is used in contexts where using Streams is not possible, like cloud functions.

**Examples**:

```typescript
const passBuffer = pass.getAsBuffer();
doSomethingWithPassBuffer(Buffer);
```

---

#### .getAsStream()

```typescript
pass.getAsStream(): Stream;
```

**Description**:

Creates a stream for the zipped pass.

**Examples**:

```typescript
const passStream = pass.getAsStream();
doSomethingWithPassStream(stream);
```

---

#### .getAsRaw()

```typescript
pass.getAsRaw(): Readonly<{ [path: string]: Buffer }>;
```

**Description**:

Returns a frozen object containing all the files along with their buffers (with compiled signature and manifest).

The purpose of this stands in how zips are created. In passkit-generator v2.x.x, a different and asyncronous library was being used to create zips. Due to a worse API, it was replaced by do-not-zip, which acts more like a buffers concatenator instead of a compressor. This compromise improved the creation of zips by making zips generation synchronous, through a very-lightweight package, but incremented final archives size.

For this reason, if the developer is already using a different zip library and is providing quite large files, better result in terms of pass weight might get obtained by manipulating the list of files provided by this method and feeding them to the already-available zip library.

**Examples**:

```typescript
import { toBuffer as doNotZip } from "do-not-zip";

const passFiles = pass.getAsRaw();

const crunchedData = Object.entries(passFiles).map(([path, data]) => ({
	path,
	data,
}));

doSomethingWithCustomZippedPass(doNotZip(chunchedData));
```

---

### Getters / setters

---

#### .props (getter only)

```typescript
const currentProps = pass.props;
```

**Returns**:

An object containing all the current props;

**Description**:

This is a way to access to the current props.
Querying this getter, will return a nested-clone of the props.
Props are sorted like you are navigating in pass.json;

**Example**:

```typescript
const currentLocations = pass.props["locations"];
pass.locations(
	{
		latitude: 66.45725212,
		longitude: 33.01000442,
	},
	{
		longitude: 4.42634523,
		latitude: 5.344233323352,
	},
	...currentLocations,
);
```

---

#### .certificates (setter only)

```typescript
pass.certificates = { ... };
```

**Description**:

Provides a later way to specify or change the used certificates.

It accepts an object which has the same type signature as the one requested in `constructor` and `PKPass.from`.

Throws if pass is frozen due to a previous export or if schema validation on provided object fails.

---

#### .type (setter + getter)

```typescript
pass.type = "coupon";
pass.type !== undefined;
```

**Description**:

Provides a later way to specify a pass type. The availability of this setter, allows developers to create a PKPass without the need to have or create a pass.json first and provide it as file, or provide a generic one.

Please note that using this setter, will reset all your fields (primaryFields, secondaryFields, ...) and transitType, as they are strictly linked to the type.

Setter throws if pass is frozen due to a previous export or if and invalid type is provided.

**Example**:

```typescript
const pass = new PKPass({ ... }, { ... }, { ... });

// Assuming a pass.json with a type inside has been added first and it has 5 valid primaryFields.
console.log(pass.primaryFields.length); // 5

pass.type = "storeCard";

console.log(pass.primaryFields.length); // 0
console.log("Pass type is", pass.type); // "Pass type is storeCard"
```

---

#### .mimeType (getter only) - Inherited from Bundle

```typescript
const passMIME = pass.mimeType;
```

**Description**:

This getter allows to abstract the kind of mimeType is being served when generating a PKPass archive or a PKPasses archive (see below). This property is automatically set when a PKPass is created (`application/vnd.apple.pkpass`) or when `PKPass.pack` is invoked (`application/vnd.apple.pkpasses`).

---

## Bundling multiple passes together

Starting from iOS 15, [developers can serve multiple passes through Safari](https://developer.apple.com/videos/play/wwdc2021/10092/?time=99) by zipping multiple passes together in a single Bundle with extension `.pkpasses` and serve it with mimeType `application/vnd.apple.pkpasses`.

#### PKPass.pack()

```typescript
PKPass.pack(...args: PKPass[]): Bundle;
```

**Description**

This method accepts a series of PKPass instances and returns a new Bundle instance (the one from which PKPass inherits some properties), and allows you to serve all the passes together.

**Please note that, internally, this method invokes `.getAsBuffer()` on each pass instance**. This method assumes the passes provided won't be edited again and are ready to get distributed. PKPass instances will be, therefore, locked.

Throws if not all the args are instance of PKPass.

**Example**:

```typescript
const [passInstance1, passInstance2, passInstance3] = getThreePassesSomehow();

const pkpassesBundle = PKPass.pack(passInstance1, passInstance2, passInstance3);

serveBufferWithMimeTypeSomehow(
	pkPassesBundle.getAsBuffer(),
	pkPassesBundle.mimeType /** -> application/vnd.apple.pkpasses **/,
);
```

---

Thanks for using this library. ❤️ Every contribution is welcome.
