<div align="center">
	<br>
	<br>
	<img width="600" src="assets/logo.svg?sanitize=true" alt="Node Passkit Generator logo">
	<br>
	<br>
	<p align="center">Simple Node.js interface to generate customized <a href="https://developer.apple.com/wallet/">Apple Wallet Passes</a> for iOS.</p>

[![Financial Contributors on Open Collective](https://opencollective.com/passkit-generator/all/badge.svg?label=financial+contributors)](https://opencollective.com/passkit-generator) ![](https://img.shields.io/npm/v/passkit-generator.svg?label=passkit-generator)
![](https://img.shields.io/node/v/passkit-generator.svg)

</div>
<br>

### Architecture

This package was created with a specific architecture in mind: **application** and **model** (as preprocessed entity), to split as much as possible static objects (such as logo, background, icon, etc.) from dynamic ones (translations, barcodes, serialNumber, ...).

Pass creation and population doesn't fully happen in runtime. Pass template (model) can be one of a set of buffers or a folder, that will contain all the objects needed (static medias) and structure to make a pass work.

Both Pass template will be read and pushed as they are in the resulting .zip file, while dynamic objects will be patched against `pass.json` or generated in runtime (`manifest.json`, `signature` and translation files).
All the static medias from both sources, will be read and pushed as they are in the resulting .zip file; dynamic object will be patched against `pass.json`, generated on runtime (`manifest.json`, `signature`) or merged if already existing (translation files).

> ⚠ Do not rely on branches outside "master", as might not be stable and will be removed once merged.

### Install
```sh
$ npm install passkit-generator --save
```

___

### API Documentation

This package comes with an [API documentation](./API.md), that makes available a series of methods to create and customize passes.

___

### Looking for the previous major version?

Check the [v1 branch](https://github.com/alexandercerutti/passkit-generator/tree/v1.6.8). That branch is kept for reference only.

___

### Coming from the previous major version?

Look at the [Migration Guide](https://github.com/alexandercerutti/passkit-generator/wiki/Migrating-from-v1-to-v2).

___

## Get Started

##### Model

The first thing you'll have to do, is to start creating a model. A model contains all the basic pass data that compose the Pass identity.
These data can be files (icon, thumbnails, ...), or pieces of information to be written in `pass.json` (Pass type identifier, Team Identifier, colors, ...).

This package allows to use two kinds of models: **Folder Model** or **Buffer Model**. If starting from scratch, the preferred solution is to use the folder as model, as it will allow you to access easily all the files. Also, a buffer model is mainly designed for models that are ready to be used in your application.

Let's suppose you have a file `model.zip` stored somewhere: you unzip it in runtime and then get the access to its files as buffers. Those buffers should be available for the rest of your application run-time and you shouldn't be in need to read them every time you are going to create a pass.

> To keep a model in memory, the method [`createAbstractModel`](https://github.com/alexandercerutti/passkit-generator/blob/master/API.md#create-an-abstract-model) has been created.

___

> Using the .pass extension is a best practice, showing that the directory is a pass package.
> ([Build your first pass - Apple Developer Portal](https://apple.co/2LYXWo3)).

Following to this best practice, the package is set to require each folder-model to have a **_.pass_** extension.
If omitted in the configuration (as in [Usage Example](#usage_example), at "model" key), it will be forcefully added.

___

```bash
$ cd yourProjectDir;
$ mkdir passModels && mkdir $_/myFirstModel.pass && cd $_;
```

Follow the [Apple Developer documentation](https://apple.co/2wuJLC1) (_Package Structure_) to build a correct pass model. The **icon is required** in order to make the pass work. *Manifest.json* and *signature* will be automatically ignored from the model and generated in runtime.

You can also create `.lproj` folders (e.g. *en.lproj* or *it.lproj*) containing localized media. To include a folder or translate texts inside the pass, please refer to [Localizing Passes](./API.md#method_localize) in the API documentation.

To include a file that belongs to an `.lproj` folder in buffers, you'll just have to name a key like `en.lproj/thumbnail.png`.

##### Pass.json

Create a `pass.json` by taking example from examples folder models or the one provided by Apple for the [first tutorial](https://apple.co/2NA2nus) and fill it with the basic informations, that are `teamIdentifier`, `passTypeIdentifier` and all the other basic keys like pass type. Please refer to [Top-Level Keys/Standard Keys](https://apple.co/2PRfSnu) and [Top-Level Keys/Style Keys](https://apple.co/2wzyL5J).

```json
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.<bundle id>",
  "teamIdentifier": "<here your team identifier>",
  "organizationName": "<your organization name>",
  "description": "A localizable description of your pass. To do so, put here a placeholder.",
  "boardingPass": {}
}
```
<a name="certificates"></a>

##### Certificates

The third step is about the developer and WWDR certificates. I suggest you to create a certificate-dedicated folder inside your working directory (e.g. `./certs`) to contain everything concerning the certificates.

This is a standard procedure: you would have to do it also without using this library. We'll use OpenSSL to complete our work (or to do it entirely, if only on terminal), so be sure to have it installed.
You'll need the following three elements:

* Apple WWDR (_Worldwide Developer Relationship_) certificate
* Signer certificate
* Signer key

While WWDR can be obtained from [Apple PKI Portal](https://www.apple.com/certificateauthority/), to get the `signer key` and the `certificate`, you'll have to get first a `Certificate Signing Request` (`.certSigningRequest` file) and upload it to Apple Developers Portal, at [Pass Types Identifiers](https://developer.apple.com/account/ios/identifier/passTypeId) (open it, it's worth it 😜).

<br>
<hr>

> **If you don't have access to macOS** (or you are a terminal enthusiast), **follow [these steps](./non-macOS-steps.md) instead.**
<hr>


1. Create a new pass type identifier and provide it with a Name and a reverse-domain bundle id (starting with "pass."). You will put this identifier as value for `passTypeIdentifier` in `pass.json` file.
2. Confirm and register the new identifier.
3. Go back to the pass type identifiers, click on your new pass id and edit it.
4. Click "Create Certificate" button and follow the instructions until you won't download a certificate like `pass.cer`. (here you'll generate the `.certSigningRequest` file to be uploaded).
5. Open the downloaded certificate. Go in "Certificates" on left in macOS Keychain access and `right-click > Export "\<certname\>"`. Choose a password (and write it down) and you will get a PKCS#12 file (`.p12`).
6. Open terminal, place where you want to save the files and insert the following OpenSSL commands changing the contents between angular brackets. You'll have to choose a secret passphrase (and write it down) that you'll use also in the application.

    ```sh
	# Creating and changing dir
    $ mkdir "certs" && cd $_
	# Extracting key and cert from pkcs12
    $ openssl pkcs12 -in <cert-name>.p12 -clcerts -nokeys -out signerCert.pem -passin pass:<your-password>
    $ openssl pkcs12 -in <cert-name>.p12 -nocerts -out signerKey.pem -passin pass:<your-password> -passout pass:<secret-passphrase>
    ```
7. Execute step 5 also for the WWDR certificate (`.cer`) you downloaded from Apple PKI portal (default name: *AppleWWDRCA.cer*) but instead exporting it as PKCS#12 (`.p12` - you'll also be unable to do that), export it as PEM (`.pem`) file.

___

<a name="usage_example"></a>

## Usage example

```typescript
/**
 * Use `const { createPass } = require("passkit-generator");`
 * for usage in pure Node.js. Please note that `Pass` is only exported
 * as Typescript type.
 */
import { createPass, Pass } from "passkit-generator";

try {
	const examplePass = await createPass({
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
		}
	});

	// Adding some settings to be written inside pass.json
	examplePass.localize("en", { ... });
	examplePass.barcode("36478105430"); // Random value

	// Generate the stream, which gets returned through a Promise
	const stream: Stream = examplePass.generate();

	doSomethingWithTheStream(stream);
} catch (err) {
	doSomethingWithTheError(err);
}
```

For more complex usage examples, please refer to [examples](https://github.com/alexandercerutti/passkit-generator/tree/master/examples) folder.

___

## Other

If you used this package in any of your projects, feel free to open a topic in issues to tell me and include a project description or link (for companies). 😊 You'll make me feel like my time hasn't been wasted, even if it had not anyway because I learnt a lot of things by creating this.

The idea to develop this package, was born during the Apple Developer Academy 17/18, in Naples, Italy, driven by the need to create an iOS app component regarding passes generation for events.

A big thanks to all the people and friends in the Apple Developer Academy (and not) that pushed me and helped me into realizing something like this and a big thanks to the ones that helped me to make technical choices and to all the contributors.

Any contribution, is welcome.
Made with ❤️ in Italy.

## Contributors

### Code Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].
<a href="https://github.com/alexandercerutti/passkit-generator/graphs/contributors"><img src="https://opencollective.com/passkit-generator/contributors.svg?width=890&button=false" /></a>

### Financial Contributors

Become a financial contributor and help us sustain our community. [[Contribute](https://opencollective.com/passkit-generator/contribute)]

#### Individuals

<a href="https://opencollective.com/passkit-generator"><img src="https://opencollective.com/passkit-generator/individuals.svg?width=890"></a>

#### Organizations

Support this project with your organization. Your logo will show up here with a link to your website. [[Contribute](https://opencollective.com/passkit-generator/contribute)]

<a href="https://opencollective.com/passkit-generator/organization/0/website"><img src="https://opencollective.com/passkit-generator/organization/0/avatar.svg"></a>
<a href="https://opencollective.com/passkit-generator/organization/1/website"><img src="https://opencollective.com/passkit-generator/organization/1/avatar.svg"></a>
<a href="https://opencollective.com/passkit-generator/organization/2/website"><img src="https://opencollective.com/passkit-generator/organization/2/avatar.svg"></a>
<a href="https://opencollective.com/passkit-generator/organization/3/website"><img src="https://opencollective.com/passkit-generator/organization/3/avatar.svg"></a>
<a href="https://opencollective.com/passkit-generator/organization/4/website"><img src="https://opencollective.com/passkit-generator/organization/4/avatar.svg"></a>
<a href="https://opencollective.com/passkit-generator/organization/5/website"><img src="https://opencollective.com/passkit-generator/organization/5/avatar.svg"></a>
<a href="https://opencollective.com/passkit-generator/organization/6/website"><img src="https://opencollective.com/passkit-generator/organization/6/avatar.svg"></a>
<a href="https://opencollective.com/passkit-generator/organization/7/website"><img src="https://opencollective.com/passkit-generator/organization/7/avatar.svg"></a>
<a href="https://opencollective.com/passkit-generator/organization/8/website"><img src="https://opencollective.com/passkit-generator/organization/8/avatar.svg"></a>
<a href="https://opencollective.com/passkit-generator/organization/9/website"><img src="https://opencollective.com/passkit-generator/organization/9/avatar.svg"></a>
