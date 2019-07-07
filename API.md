# API Reference

The flow of execution is really easy (once setted-up everything):

* You get your data from somewhere
* You set the needed data in the pass through methods, overrides and data in fields
* You generate the pass stream through `.generate()` method
* Hooray 😄🎉

Some details:

* Properties will be checked against schemas, which are built to reflect Apple's specifications, that can be found on Apple Developer Portal, at [PassKit Package Format Reference](https://apple.co/2MUHsm0).

* Here below are listed all the available methods that library will let you use.

* In case of troubleshooting, you can start your project with "debug flag" as follows:

```sh
$ DEBUG=* node index.js
```

For other OSs, see [Debug Documentation](https://www.npmjs.com/package/debug).

* Keep this as always valid for the reference:

```javascript
const { Pass } = require("passkit-generator");
```
___

### Index:

* [Instance](#method_constructor)
	* [Localizing Passes](#localizing_passes)
		* [.localize()](#method_localize)
	* Setting barcode
		* [.barcodes()](#method_barcodes)
		* [.barcode()](#method_barcode)
	* Setting expiration / voiding the pass
		* [.expiration()](#method_expiration)
		* [.void()](#method_void)
	* Setting relevance
		* [.beacons()](#method_beacons)
		* [.locations()](#method_locations)
		* [.relevantDate()][#method_revdate]
	* Setting NFC
		* [.nfc()](#method_nfc)
	* Getting the current information
		* [.props](#getter_props)
	* [Setting Pass Structure Keys (primaryFields, secondaryFields, ...)](#prop_fields)
		* [TransitType](#prop_transitType)
	* Generating the compiled pass.
		* [.generate()](#method_generate)

<br><br>
___

<a name="method_constructor"></a>

#### constructor()

```typescript
const pass = await createPass({ ... });
```

**Returns**:

`Promise<Pass>`

**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|---------------|:-------------:|:-----------:|
| options | Object | The options to create the pass | false | -
| options.model | String/Path/Buffer Object | The model path or a Buffer Object with path as key and Buffer as content | false | -
| options.certificates | Object | The certificate object containing the paths to certs files. | false | -
| options.certificates.wwdr | String/Path | The path to Apple WWDR certificate or its content. | false | -
| options.certificates.signerCert | String/Path | The path to Developer certificate file or its content. | false | -
| options.certificates.signerKey | Object/String | The object containing developer certificate's key and passphrase. If string, it can be the path to the key file or its content. If object, must have `keyFile` key and might need `passphrase`. | false | -
| options.certificates.signerKey.keyFile | String/Path | The path to developer certificate key or its content. | false | -
| options.certificates.signerKey.passphrase | String \| Number | The passphrase to use to unlock the key. | false | -
| options.overrides | Object | Dictionary containing all the keys you can override in the pass.json file and does not have a method to get overridden. | true | { }

<br><br>
<a name="localizing_passes"></a>
___

**Localizing Passes**:
___

Following Apple Developer Documentation, localization (L10N) is done by creating a `.lproj` folder for each language you want to translate your pass, each named with the relative [ISO-3166-1 alpha-2](https://it.wikipedia.org/wiki/ISO_3166-1_alpha-2) code (e.g. `en.lproj`).

In this library, localization can be done in three ways: **media-only** (images), **translations-only** or both.
The only differences stands in the way the only method below is used and how the model is designed.
If this method is used for translations and the model already contains a `pass.strings` for the specified language, the translations will be appended to that file.

> If you are designing your pass for a language only, you can directly replace the placeholders in `pass.json` with translation.

<br>
<a name="method_localize"></a>

#### .localize()

```typescript
pass.localize(lang: string, options = {});
```

**Returns**:

`Object<Pass> (this)`

**Description**:

You may want to create the folder and add translated media and no translations; else you may want to add only translations without different medias or maybe both.

In the first case, create the `.lproj` folder in the model root folder and add the translated medias inside. Then use the method by passing only the first parameters, the code.

In the other two cases, you'll need to specify also the second argument (the translations to be added to `pass.strings` file, which will be added later).

**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|-------------|----------|:-------------:|
| lang | String | The ISO-3166-1 language code | false | -
| options | Object | Translations in format `{ <PLACEHOLDER>: "TRANSLATED-VALUE"}`. | true | undefined \| { }

**Example**:

```javascript
pass
	.localize("it", {
		"EVENT": "Evento",
		"LOCATION": "Posizione"
	})
	.localize("de", {
		"EVENT": "Ereignis",
		"LOCATION": "Ort"
	})
	.localize("en")
```

<br><br>
___

**Setting barcodes**:
___

<a name="method_barcodes"></a>

#### .barcodes()

```typescript
pass.barcodes(first: string | schema.Barcode, ...data: schema.Barcodes[]) : this;
```

**Returns**:

`Object<Pass> (this)`

**Description**:

Setting barcodes can happen in two ways: `controlled` and `uncontrolled` (autogenerated), which mean how many [barcode structures](https://apple.co/2myAbst) you will have in your pass.

Passing a `string` to the method, will lead to an `uncontrolled` way: starting from the message (content), all the structures will be generated. Any further parameter will be ignored.

Passing *N* barcode structures (see below), will only validate them and push only the valid ones.

This method will not take take of setting retro-compatibility, of which responsability is assigned to `.barcode()`.

**Arguments**:

|  Key  | Type | Description | Optional |
|-------|------|-------------|----------|
| first | `String` \| `schema.Barcode` | first value of barcodes | false
| ...data | `schema.Barcode[]` | the other barcode values | true

**Examples**:

```typescript
pass.barcodes("11424771526");

// or

pass.barcodes({
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

**See**: [PassKit Package Format Reference # Barcode Dictionary](https://apple.co/2myAbst)
<br>
<br>
<a name="method_barcode"></a>

#### .barcode()

```javascript
pass.barcode(data: string);
```

**Returns**:

`Object<Pass> (this)`

**Description**:

It will let you choose the format to be used in barcode property as backward compatibility.
Also it will work only if `barcodes()` method has already been called or if the current properties already have at least one barcode structure in it and if it matches with the specified one.

`PKBarcodeFormatCode128` is not supported in barcode. Therefore any attempt to set it, will fail.

**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|-------------|----------|:-------------:|
| format | String | Format to be used. Must be one of these types: `PKBarcodeFormatQR`, `PKBarcodeFormatPDF417`, `PKBarcodeFormatAztec` | false | -

**Example**:

```javascript
// Based on the previous (barcodes) example
pass
	.barcodes(...)
	.barcode("PKBarcodeFormatQR");

// This won't set the property since not found.
pass
	.barcodes(...)
	.barcode("PKBarcodeFormatAztec");
```


<br><br>
___

**Setting expiration / void the pass**:
___

<a name="method_expiration"></a>

#### .expiration()

```typescript
pass.expiration(date: Date) : this;
```

**Returns**:

`Object<Pass> (this)`

**Description**:

It sets the date of expiration to the passed argument.
If the parsing fails, the error will be emitted only in debug mode and the property won't be set.
Passing `null` as the parameter, will remove the value.

**Arguments**:

| Key | Type | Description | Optional |
|-----|------|-------------|----------|
| date | String/date | The date on which the pass will expire | false

<br>
<hr>

<a name="method_void"></a>

#### .void()

```javascript
pass.void();
```

**Returns**:

`Object<Pass> (this)`

**Description**:

It sets directly the pass as voided.

<br><br>
___

**Setting relevance**:
___

<a name="method_beacons"></a>

#### .beacons()

```typescript
pass.beacons(...data: schema.Beacons[]): this;
```

**Returns**:

`Object<Pass> (this)`

**Description**:

Sets the beacons information in the passes.
If other beacons structures are available in the structure, they will be overwritten.
Passing `null` as parameter, will remove the content.

**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|-------------|----------|:-------------:|
| ...data | [schema.Beacons[]](https://apple.co/2XPDoYX) \| `null` | The beacons structures | false | -

**Example**:

```typescript
pass.beacons({
	"major": 55,
	"minor": 0,
	"proximityUUID": "59da0f96-3fb5-43aa-9028-2bc796c3d0c5"
}, {
	"major": 65,
	"minor": 46,
	"proximityUUID": "fdcbbf48-a4ae-4ffb-9200-f8a373c5c18e",
});
```

<br>
<hr>

<a name="method_locations"></a>

#### .locations()

```typescript
pass.locations(...data: schema.Locations[]): this;
```

**Returns**:

`Object<Pass> (this)`

**Description**:

Sets the location-relevance information in the passes.
If other location structures are available in the structure, they will be overwritten.
Passing `null` as parameter, will remove its content;

**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|-------------|----------|:-------------:|
| ...data | [schema.Locations[]](https://apple.co/2LE00VZ) \| `null` | The location structures | false | -

**Example**:

```typescript
pass.locations({
	"latitude": 66.45725212,
	"longitude": 33.010004420
}, {
	"longitude": 4.42634523,
	"latitude": 5.344233323352
});
```
<br>
<hr>

<a name="method_relevantDate"></a>

#### .relevantDate()

```typescript
pass.relevantDate(date: Date): this;
```

**Returns**:

`Object<Pass> (this)`

**Description**:

Sets the relevant date for the current pass. Passing `null` to the parameter, will remove its content.

**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|-------------|----------|:-------------:|
| date | Date \| `null` | The relevant date | false | -

<br><br>
___

**NFC Support**:
___

<a name="method_nfc"></a>

#### .nfc()

```typescript
pass.nfc(data: schema.NFC): this
```

**Returns**:

`Object<Pass> (this)`

**Description**:

It sets NFC info for the current pass. Passing `null` as parameter, will remove its value.

>*Notice*: **I had the possibility to test in no way this pass feature and, therefore, the implementation. If you need it and this won't work, feel free to contact me and we will investigate together 😄**

**Arguments**:

| Key | Type | Description | Optional |
|-----|------|-------------|----------|
| data | [schema.NFC](https://apple.co/2XrXwMr) \| `null` | NFC structure | false

**See**: [PassKit Package Format Reference # NFC](https://apple.co/2wTxiaC)

<br><br>
<hr>

<a name="getter_props"></a>

#### .props()

```typescript
pass.props;
```

**Returns**:

An object containing all the current props;

**Description**:

This is a getter: a way to access to the current props before generating a pass. In here are available the props set both from pass.json reading and this package methods usage, along with the valid overrides passed to `createPass`. The keys are the same used in pass.json.

It does not contain fields content (`primaryFields`, `secondaryFields`...) and `transitType`, which are still accessible through their own props.

**Example**:

```typescript
const currentLocations = pass.props["locations"];
pass.locations({
	"latitude": 66.45725212,
	"longitude": 33.010004420
}, {
	"longitude": 4.42634523,
	"latitude": 5.344233323352
},
...currentLocations);
```

<br><br>

<a name="prop_fields"></a>
___

**Setting Pass Structure Keys (primaryFields, secondaryFields, ...)**:
___

Unlike method-set properties or overrides, to set fields inside areas (*primaryFields*, *secondaryFields*, *auxiliaryFields*, *headerFields*, *backFields*), this library make available a dedicated interface that extends native Array, to let you perform all the operations you need on the fields. Still, **shouldOverride** option, will determine whether default inserted fields should be kept or not.

**Examples:**

```javascript
pass.headerFields.push({
	key: "header1",
	label: "Data",
	value: "25 mag",
	textAlignment: "PKTextAlignmentCenter"
}, {
	key: "header2",
	label: "Volo",
	value: "EZY997",
	textAlignment: "PKTextAlignmentCenter"
});

pass.primaryFields.pop();
```

**See**: [Passkit Package Format Reference # Field Dictionary Keys](https://apple.co/2NuDrUM)

<hr>

<a name="prop_transitType"></a>

#### .transitType

```javascript
pass.transitType = "PKTransitTypeAir";
```

**Description**:

Since this property belongs to the "Structure Keys" but is not an "array of field dictionaries" like the other keys on the same level, a setter (and obv. also a getter) got included in this package to check it against a schema (which is like, "is a string and contains one of the following values: **PKTransitTypeAir**, **PKTransitTypeBoat**, **PKTransitTypeBus**, **PKTransitTypeGeneric**, **PKTransitTypeTrain**", as described in Passkit Package Format Reference).

<br><br>
___

**Generating the compiled Pass**
___

Generating the pass is the last step of the process (before enjoying 🎉).
Since the file format is `.pkpass` (which is a `.zip` file with changed MIME), this method will return a `Stream`, which can be used to be piped to a webserver response or to be written in the server.
As you can see in [examples folder](/examples), to send a .pkpass file, a basic webserver uses MIME-type `application/vnd.apple.pkpass`.

<br>

<a name="method_generate"></a>

#### .generate()

```javascript
pass.generate();
```

**Returns**: `Promise`

**Description**:

The returned Promise will contain a stream or an error.

**Examples**:

```javascript
pass.generate()
	.then(stream => {
		doSomethingWithPassStream();
	})
	.catch(error => {
		doSomethingWithThrownError();
	});
```
___

Thanks for using this library. ❤️ Every contribution is welcome.
