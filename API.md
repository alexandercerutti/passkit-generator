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
		* [.barcode()](#method_barcode)
			* [.backward()](#method_bBackward)
			* [.autocomplete()](#method_bAutocomplete)
	* Setting expiration / voiding the pass
		* [.expiration()](#method_expiration)
		* [.void()](#method_void)
	* Setting relevance
		* [.relevance()](#method_relevance)
	* Setting NFC
		* [.nfc()](#method_nfc)
	* [Setting Pass Structure Keys (primaryFields, secondaryFields, ...)](#prop_fields)
		* [<field>.push()](#prop_fields-push)
		* [<field>.pop()](#prop_fields-pop)
		* [TransitType](#prop_transitType)
	* Generating the compiled pass.
		* [.generate()](#method_generate)

<br><br>
___

<a name="method_constructor"></a>

#### constructor()

```javascript
var pass = new Pass(options);
```

**Returns**:

`Object<Pass>`

**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|---------------|:-------------:|:-----------:|
| options | Object | The options to create the pass | false | -
| options.model | String/Path | The model path to be used to generate a new model. | false | -
| options.certificates | Object | The certificate object containing the paths to certs files. | false | -
| options.certificates.wwdr | String/Path | The path to Apple WWDR certificate. | false | -
| options.certificates.signerCert | String/Path | The path to Developer certificate file. | false | -
| options.certificates.signerKey | Object | The object containing developer certificate's key and passphrase. | false | -
| options.certificates.signerKey.keyFile | String/Path | The path to developer certificate key. | false | -
| options.certificates.signerKey.passphrase | String \| Number | The passphrase to use to unlock the key. | false | -
| options.overrides | Object | Dictionary containing all the keys you can override in the pass.json file and does not have a method to get overridden. | true | { }
| options.shouldOverwrite | Boolean | Setting this property to false, will make properties in `overrides` and fields to be pushed along with the ones added through methods to the existing ones in pass.json. | true | true

<br><br>
<a name="localizing_passes"></a>
___

**Localizing Passes**:
___

Following Apple Developer Documentation, localization (L10N) is done by creating a `.lproj` folder for each language you want to translate your pass, each named with the relative [ISO-3166-1 alpha-2](https://it.wikipedia.org/wiki/ISO_3166-1_alpha-2) code (e.g. `en.lproj`).

In this library, localization can be done in three ways: **media-only** (images), **translations-only** or both.
The only differences stands in the way the only method below is used and how the model is designed.

> If you are designing your pass for a language only, you can directly replace the placeholders in `pass.json` with translation.

<br>
<a name="method_localize"></a>

#### .localize()

```javascript
pass.localize(lang, options);
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
| options | Object | Translations in format PLACEHOLDER : TRANSLATED-VALUE. | true | undefined \| { }

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

<a name="method_barcode"></a>

#### .barcode()

```javascript
pass.barcode(data);
```

**Returns**:

`Improved Object<Pass> (this with some "private" methods available to be called under aliases, as below)`

**Description**:

Each object in `data` will be filtered against a schema ([Apple reference](https://apple.co/2myAbst)) validation and used if correctly formed.

If the argument is an Object, it will be treated as one-element Array.

If the argument is a String or an Object with `format` parameter missing, but `message` available, the structure will be **autogenerated** complete of all the fallbacks (4 dictionaries).

To support versions prior to iOS 9, `barcode` key is automatically supported as the first valid value of the provided (or generated) barcode. To change the key, see below.

**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|-------------|----------|:-------------:|
| data | String \| Array\<Object> \| Object | Data to be used in the barcode | false | -

**Examples**:

```javascript
	pass.barcode("11424771526");

	// or

	pass.barcode({
		message: "11424771526",
		format: "PKBarcodeFormatCode128"
		altText: "11424771526"
	});

	// or

	pass.barcode([{
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
	}]);
```

**See**: [PassKit Package Format Reference # Barcode Dictionary](https://apple.co/2myAbst)
<br>
<a name="method_bBackward"></a>

#### .barcode().backward()

```javascript
pass.barcode(data).backward(format);
```

**Returns**:

`Object<Pass> (this)`

**Description**:

It will let you choose the format to be used in barcode property as backward compatibility.
Also it will work only if `data` is provided to `barcode()` method and will fail if the selected format is not found among barcodes dictionaries array.

**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|-------------|----------|:-------------:|
| format | String | Format to be used. Must be one of these types: *PKBarcodeFormatQR*, *PKBarcodeFormatPDF417*, *PKBarcodeFormatAztec* | false | -

**Example**:

```javascript
// Based on the previous example
pass
	.barcode(...)
	.backward("PKBarcodeFormatQR");

// This won't set the property since not found.
pass
	.barcode(...)
	.backward("PKBarcodeFormatAztec");
```

<br>
<a name="method_bAutocomplete"></a>

#### .barcode().autocomplete()

```javascript
pass.barcode(data).autocomplete();
```

**Returns**:

`Improved Object<Pass> ("this" with backward() support and length prop. reporting how many structs have been added).`

**Description**:

It will generate all the barcodes fallback starting from the first dictionary in `barcodes`.

<br><br>
___

**Setting expiration / void the pass**:
___

<a name="method_expiration"></a>

#### .expiration()

```javascript
pass.expiration(date [, format]);
```

**Returns**:

`Object<Pass> (this)`

**Description**:

It sets the date of expiration to the passed argument. The date will be automatically parsed in order in the following formats:

* **MM-DD-YYYY hh:mm:ss**,
* **DD-MM-YYYY hh:mm:ss**.

Otherwise you can specify a personal format to use.

Seconds are not optionals.
If the parsing fails, the error will be emitted only in debug mode and the property won't be set.

**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|-------------|----------|:-------------:|
| date | String/date | The date on which the pass will expire | false | -
| format | String | A custom format to be used to parse the date | true | undefined

<a name="method_void"></a>

#### .void()

```javascript
pass.void();
```

**Returns**:

`Object<Pass> (this)`

**Description**:

It sets directly the pass as voided (void: true).

<br><br>
___

**Setting relevance**:
___

<a name="method_relevance"></a>

#### .relevance()

```javascript
pass.relevance(key, value [, relevanceDateFormat]);
```

**Returns**:

`Improved Object<Pass> (this with length property)`

**Description**:

It sets the relevance key in the pass among four: **beacons**, **locations**, **relevantDate** and **maxDistance**.
See [Apple Documentation dedicated page](https://apple.co/2QiE9Ds) for more.

For the first two keys, the argument 'value' (which will be of type **Array\<Object>**) will be checked and filtered against dedicated schema.

For *relevantDate*, the date is parsed in the same formats of [#expiration()](#method_expiration). For *maxDistance*, the value is simply converted as Number and pushed only with successful conversion.


**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|-------------|----------|:-------------:|
| key | String | The relevance key to be set, among **beacons**, **locations**, **relevantDate** and **maxDistance** | false | -
| value | String \| Number \| Array\<Object> | Type depends on the key. Please refer to the description above for more details | false | -
| relevanceDateFormat | String | Custom date format. Will be only used when using `relevanceDate` key | true | undefined

**Example**:

```javascript
pass.relevance("location", [{
	longitude: "73.2943532945212",
	latitude: "-42.3088613015625",
]);

pass.relevance("maxDistance", 150);

// DD-MM-YYYY -> April, 10th 2021
pass.relevance("relevantDate", "10/04/2021", "DD-MM-YYYY");

// MM-DD-YYYY -> October, 4th 2021
pass.relevance("relevantDate", "10/04/2021");
```

<br><br>
___

**NFC Support**:
___

<a name="method_nfc"></a>

#### .nfc()

```javascript
pass.nfc([data, ...])
```

**Returns**:

`Object<Pass> (this)`

**Description**:

It sets the property for nfc dictionary.
An Object as argument will be treated as one-element array.

>*Notice*: **I had the possibility to test in no way this pass feature and, therefore, the implementation. If you need it and this won't work, feel free to contact me and we will investigate together 😄**

**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|-------------|----------|:-------------:|
| data | Array\<Object> \| Object | The data regarding to be used for nfc | false | -

**See**: [PassKit Package Format Reference # NFC](https://apple.co/2wTxiaC)
<br>
<br>
<a name="prop_fields"></a>
___

**Setting Pass Structure Keys (primaryFields, secondaryFields, ...)**:
___

Unlike method-set properties or overrides, to set fields inside areas (*primaryFields*, *secondaryFields*, *auxiliaryFields*, *headerFields*, *backFields*), this library make available a dedicated array-like interface, with just the essential methods: `push()` and `pop()`.

<br>

<a name="prop_fields-push"></a>

#### <field>.push()

```javascript
pass.<field>.push(...fields);
```

**Returns**:

`Number - the amount of valid fields added to area`

**Description**:

An argument of type "object" is considered as one-element array.
Fields are filtered against a schema.

**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|-------------|----------|:-------------:|
| fields | Array\<Object> \| Object | Field to be added to an area | false | -

**Examples**:

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

pass.primaryFields.push({
	key: "IATA-source",
	value: "NAP",
	label: "Napoli",
	textAlignment: "PKTextAlignmentLeft"
}, {
	key: "IATA-destination",
	value: "VCE",
	label: "Venezia Marco Polo",
	textAlignment: "PKTextAlignmentRight"
});
```

**See**: [Passkit Package Format Reference # Field Dictionary Keys](https://apple.co/2NuDrUM)

<br>

<a name="prop_fields-pop"></a>

#### <field>.pop()

```javascript
pass.<field>.pop(amount);
```

**Returns**:

`Number - the amount of fields removed.`

**Description**:

This method is a mix between `Array.prototype.pop` and `Array.prototype.slice`.
In fact, passing this method an amount as parameter, will make it act as `slice`. Otherwise it will act as `pop`.

**Arguments**:

| Key | Type | Description | Optional | Default Value |
|-----|------|-------------|----------|:-------------:|
| amount | Number | Amount of fields to be removed from that area | true | -1

**Examples**:

```javascript
pass.secondaryFields.pop(); // last element is popped out.

pass.backFields.pop(5); // last five elements are popped out.
```

<br>

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
