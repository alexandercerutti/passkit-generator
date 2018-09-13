# Node PassKit Generator

This is my implementation of a generator for [Apple Wallet Passes](https://developer.apple.com/wallet/). The idea was born during the Apple Developer Academy 17/18, in Naples, driven by the need to develop an iOS app component regarding passes generation for events.


### Installation
This generator has two sides: application and model creation.

In fact, the pass template creation does not happen in the application. Instead you'll first have to create a folder containing all the static medias for a pass (logo, background, icon, etc.) while the dynamic info (such translations, barcodes, serialNumber and so on) will be applied in runtime.

```sh
$ npm install passkit-generator --save
```

To see the API Reference, please refer to [API document](./API.md).
Created under Node.js v10.8.0.

## Get Started

The first thing you'll have to do, is to start creating a model. A model is a folder in your project directory, with inside the basic pass infos, like the thumbnails, the icon, and the background and **pass.json** containing all the static infos about the pass, like Team identifier, Pass type identifier, colors, etc.

> Using the .pass extension is a best practice, showing that the directory is a pass package.
> (cit. [Build your first pass - Apple Developer Portal](https://apple.co/2LYXWo3)).

Following to this suggestion, each model is required to have a **.pass** extension (as suggested by Apple).

```bash
$ cd yourProjectDir;
$ mkdir passModels && mkdir $_/myFirstModel.pass && cd $_;
```

Follow the [Apple Developer documentation](https://apple.co/2wuJLC1) (_Package Structure_) to build a correct pass model. The **icon is required** in order to make the pass work. *Manifest.json* and *signature* will be automatically ignored from the model and generated in runtime.

You can also create `.lproj` folders (e.g. *en.lproj* or *it.lproj*) containing localized media. To include a folder or translate texts inside the pass, please refer to the API, [.localize()](./API.md#method_localize) method.

##### Pass.json

Create a `pass.json` by taking example from examples folder models or the one provided by Apple for the [first tutorial](https://apple.co/2NA2nus) and fill it with the basic informations, that is `teamIdentifier`, `passTypeIdentifier` and all the other basic keys like pass type. Please refer to [Top-Level Keys/Standard Keys](https://apple.co/2PRfSnu) and [Top-Level Keys/Style Keys](https://apple.co/2wzyL5J).

```javascript
{
	"formatVersion": 1,
	"passTypeIdentifier": "pass.<bundle id>",
	"teamIdentifier": "<here your team identifier>",
	"organizationName": "<your organization name>",
	"description": "A localizable description of your pass. To do so, put here a placeholder.",
	"boardingPass": {}
}
```

##### Certificates
> Requirements: OpenSSL, 

The third step is about the developer and WWDR certificates. I suggest you to create a certificate-dedicated folder inside your working directory (e.g. `./certs`) to contain everything concerning the certificates. This is a standard procedure: you would have to do it also without using this library.
You'll need the following three elements:

* Apple WWDR (_Worldwide Developer Relationship_) certificate
* Signer certificate
* Signer key

While WWDR can be obtained from [Apple PKI Portal](https://www.apple.com/certificateauthority/), to get the `signer key` and the `certificate`, you'll have to get first a `Certificate Signing Request` (`.certSigningRequest` file) from your Apple Developers Portal page, at [Pass Types Identifiers](https://developer.apple.com/account/ios/identifier/passTypeId) (open it, it worth the pain).

1. Create a new pass type identifier and provide it with a Name and a reverse-domain bundle id (starting with "pass."). You will put this identifier as value for `passTypeIdentifier` in `pass.json` file.
2. Confirm and register the new identifier.
3. Go back to the pass type identifiers, click on your new pass id and Edit it.
4. Click "Create Certificate" button and follow the instructions until you won't download a certificate like `pass.cer`.
5. Open the downloaded certificate. Go in "Certificates" on left in macOS Keychain access and `right-click > Export "\<certname\>"`. Choose a password (and write it down) and you will get a PKCS#12 file (`.p12`).
6. Open terminal, place where you want to save the files and insert the following commands changing the contents between angular brackets. You'll have to choose a secret passphrase (and write it down) that you'll use also in the application.

    ```sh
    $ mkdir "certs" && cd $_
    $ openssl pkcs12 -in <cert-name>.p12 -clcerts -nokeys -out signerCert.pem -passin pass:<your-password>
    $ openssl pkcs12 -in <cert-name>.p12 -nocerts -out signerKey.pem -passin pass:<your-password> -passout pass:<secret-passphrase>
    ```
7. Execute step 5 also for the WWDR certificate (`.cer`) you downloaded from Apple PKI portal (default name: *AppleWWDRCA.cer*) but instead exporting it as PKCS#12 (`.p12` - you'll also be unable to do that), export it as PEM (`.pem`) file.


## Usage example

```javascript
const Passkit = require("passkit-generator");

let pass = new Passkit.Pass({
	model: "./passModels/myFirstModel",
	certificates: {
		wwdr: "./certs/wwdr.pem",
		signerCert: "./certs/signercert.pem",
		signerKey: {
			keyFile: "./certs/signerkey.pem",
			passphrase: "123456"
		}
	},
	overrides: {
		// keys to be added or overridden
		serialNumber: "AAGH44625236dddaffbda"
	},
	// if true, existing keys added through methods get overwritten
	// pushed in queue otherwise.
	shouldOverwrite: true
});

// Adding some settings to be written inside pass.json
pass.localize("en", { ... });
pass.barcode("12345");

// Generate the stream, which gets returned through a Promise
pass.generate()
	.then(stream => {
		doSomethingWithTheStream(stream);
	})
	.catch(err => {
		doSomethingWithTheError(err);
	});
```

## Other

If you developed any projects using this library, open an issue topic and link it inside if open to all or just tell it. 😊 You'll make me feel like my time hasn't been wasted (it had not anyway, I learnt a lot of things by doing this).
Be sure to not include the certificates if you publish your project open to everybody.
Any contribution is welcome ❤️

A big thanks to all the people and friends in the Apple Developer Academy that pushed me and helped me into realizing something like this and a big thanks to the ones that helped me to make technical choices.
