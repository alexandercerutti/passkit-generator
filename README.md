<div align="center">
	<br>
	<br>
	<picture>
		<source media="(prefers-color-scheme: dark)"
			srcset="https://github.com/alexandercerutti/passkit-generator/raw/master/assets/logo-dark.svg?sanitize=true"
			width="600"
		>
		<img
			width="600"
			alt="Passkit-generator logo for light mode"
			src="https://github.com/alexandercerutti/passkit-generator/raw/master/assets/logo-light.svg?sanitize=true"
		>
	</picture>
	<br>
	<br>
	<p align="center">Simple Node.js interface to generate customized <a href="https://developer.apple.com/wallet/">Apple Wallet Passes</a> for iOS and WatchOS.</p>

![](https://img.shields.io/npm/v/passkit-generator.svg?label=passkit-generator)
![](https://img.shields.io/node/v/passkit-generator.svg)
<br>
[![Financial Contributors on Open Collective](https://opencollective.com/passkit-generator/all/badge.svg?label=financial+contributors)](https://opencollective.com/passkit-generator)

</div>
<br>

## Architecture

This library was created with a specific architecture in mind: **application** and **model** (as preprocessed entity), to split as much as possible static objects (such as logo, background, icon, etc.) from dynamic ones (translations, barcodes, serialNumber, ...), while keeping an eye on the different possible execution contexts.

Pass creation and population might not fully happen in runtime. This library allows to create a pass from scratch, specify a folder model (template) or specify a set of buffers. In the last two cases, both should contain all the objects needed (static medias) and structure to make a pass work.

Whenever adding files, through scratch, template or buffer, these will be read and pushed as they are in the resulting .zip file, while dynamic data will be patched (`pass.json` with props) or generated in runtime (`manifest.json`, `signature` and translation files).

### Installation

```sh
$ npm install passkit-generator --save
```

---

### API Documentation

This package comes with an [API Documentation Reference](https://github.com/alexandercerutti/passkit-generator/wiki/API-Documentation-Reference), available in wiki, that makes available a series of methods to create and customize passes.

---

### Looking for the previous major version?

Check the [v2 tag](https://github.com/alexandercerutti/passkit-generator/tree/v2.0.8). That tag is kept for reference only.

---

### Coming from the previous major version?

Look at the [Migration Guide](https://github.com/alexandercerutti/passkit-generator/wiki/Migrating-from-v2-to-v3).

---

## Getting Started

##### Model

Assuming that you don't have a model yet, the first thing you'll have to do, is creating one. A model contains all the basic pass data that compose the Pass identity.
These data can be files (icon, thumbnails, ...), or pieces of information to be written in `pass.json` (Pass type identifier, Team Identifier, colors, ...) and whatever you know that likely won't be customized on runtime.

When starting from zero, the best suggested solution is to use a Template (folder) to start with, as it will allow an easier access to all the files and data. Nothing will prevent you using a buffer model or creating a pass from scratch, but they are meant for an advanced usage or different contexts (e.g. running a cloud function might require a scratch model for faster startup, without storing the model in a "data bucket").

Let's suppose you have a file `model.zip` stored somewhere: you unzip it in runtime and then get the access to its files as buffers. Those buffers should be available for the rest of your application run-time and you shouldn't be in need to read them every time you are going to create a pass.

**To maintain a pass model available during the run-time, a PKPass instance can be created from whatever source, and then used as a template through `PKPass.from`**.

> Using the .pass extension is a best practice, showing that the directory is a pass package.
> ([Build your first pass - Apple Developer Portal](https://apple.co/2LYXWo3)).

Following to this best practice, the package is set to **require** each folder-model to have a **_.pass_** extension.

If omitted in the configuration (as in [Usage Example](#usage_example) below), it will be forcefully added, possibly resulting in a folder reading error, if your model folder doesn't have it.

---

Model creation can be performed both manually or with the auxiliary of a web tool I developed, [Passkit Visual Designer](https://pkvd.app), which will let you design your model through a neat user interface.
It will output a .zip file that you can decompress and use as source.

---

You can follow [_Create the Directory and add Files for the Pass_](https://apple.co/3zumjFI) at Apple Developer to build a correct pass model. The **icon is required** in order to make the pass work. Omitting an icon resolution, might make a pass work on a device (e.g. Mac) but not on another (e.g. iPhone). _Manifest.json_ and _signature_ will be automatically ignored from the model and generated in runtime.

You can also create `.lproj` folders (e.g. _en.lproj_ or _it.lproj_) containing localized media. To include a folder or translate texts inside the pass, please refer to [Localizing Passes](https://github.com/alexandercerutti/passkit-generator/wiki/API-Documentation-Reference#localizing-passes) in the wiki API documentation.

To include a file that belongs to an `.lproj` folder in buffers, you'll just have to name a key like `en.lproj/thumbnail.png`.

##### Pass.json

Create a `pass.json` by taking example from examples folder models or the one provided by Apple for the [first tutorial](https://apple.co/2NA2nus) and fill it with the basic informations, that are `teamIdentifier`, `passTypeIdentifier` and all the other basic keys like pass type. Please refer to [Pass interface documentation on Apple Developers](https://apple.co/3DeKKYA).

```json
{
	"formatVersion": 1,
	"passTypeIdentifier": "pass.<bundle id>",
	"teamIdentifier": "<your team identifier>",
	"organizationName": "<your organization name>",
	"description": "A localizable description of your pass. To do so, put here a placeholder.",
	"boardingPass": {}
}
```

<a name="certificates"></a>

##### Certificates

The third step is about the developer and WWDR certificates. I suggest you to create a certificate-dedicated folder inside your working directory (e.g. `./certs`) to contain everything concerning the certificates.

This is a standard procedure: you would have to do it also without using this library. We'll use OpenSSL to complete our work (or to do it entirely, if only on terminal), so be sure to have it installed.

[Follow the **FULL GUIDE in wiki** to get all the files you need to proceed](https://github.com/alexandercerutti/passkit-generator/wiki/Generating-Certificates).

---

<a name="usage_example"></a>

## Usage Examples

#### Folder Model

```typescript
/**
 * Use `const { PKPass } = require("passkit-generator");`
 * for usage in CommonJS (Node.js)
 */
import { PKPass } from "passkit-generator";

try {
	/** Each, but last, can be either a string or a Buffer. See API Documentation for more */
	const { wwdr, signerCert, signerKey, signerKeyPassphrase } = getCertificatesContentsSomehow();

	const pass = await PKPass.from({
		/**
		 * Note: .pass extension is enforced when reading a
		 * model from FS, even if not specified here below
		 */
		model: "./passModels/myFirstModel.pass",
		certificates: {
			wwdr,
			signerCert,
			signerKey,
			signerKeyPassphrase
		},
	}, {
		// keys to be added or overridden
		serialNumber: "AAGH44625236dddaffbda"
	});

	// Adding some settings to be written inside pass.json
	pass.localize("en", { ... });
	pass.setBarcodes("36478105430"); // Random value

	// Generate the stream .pkpass file stream
	const stream = pass.getAsStream();
	doSomethingWithTheStream(stream);

	// or

	const buffer = pass.getAsBuffer();
	doSomethingWithTheBuffer(buffer);
} catch (err) {
	doSomethingWithTheError(err);
}
```

#### Buffer Model

```typescript
/**
 * Use `const { PKPass } = require("passkit-generator");`
 * for usage in CommonJS (Node.js)
 */
import { PKPass } from "passkit-generator";

try {
	/** Each, but last, can be either a string or a Buffer. See API Documentation for more */
	const { wwdr, signerCert, signerKey, signerKeyPassphrase } = getCertificatesContentsSomehow();

	const pass = new PKPass({
		"thumbnail.png": Buffer.from([ ... ]),
		"icon.png": Buffer.from([ ... ]),
		"pass.json": Buffer.from([ ... ]),
		"it.lproj/pass.strings": Buffer.from([ ... ])
	},
	{
		wwdr,
		signerCert,
		signerKey,
		signerKeyPassphrase,
	},
	{
		// keys to be added or overridden
		serialNumber: "AAGH44625236dddaffbda",
	});

	// Adding some settings to be written inside pass.json
	pass.localize("en", { ... });
	pass.setBarcodes("36478105430"); // Random value

	// Generate the stream .pkpass file stream
	const stream = pass.getAsStream();
	doSomethingWithTheStream(stream);

	// or

	const buffer = pass.getAsBuffer();
	doSomethingWithTheBuffer(buffer);
} catch (err) {
	doSomethingWithTheError(err);
}

```

For more complex usage examples, please refer to [examples](https://github.com/alexandercerutti/passkit-generator/tree/master/examples) folder.

---

## Other

If you used this package in any of your projects, feel free to open a topic in issues to tell me and include a project description or link (for companies). 😊 You'll make me feel like my time hasn't been wasted, even if it had not anyway because I learnt and keep learning a lot of things by creating this.

The idea to develop this package, was born during the Apple Developer Academy 17/18, in Naples, Italy, driven by the need to create an iOS app component regarding passes generation for events.

A big thanks to all the people and friends in the Apple Developer Academy (and not) that pushed me and helped me into realizing something like this and a big thanks to the ones that helped me to make technical choices and to all the contributors.

Any contribution, is welcome.
Made with ❤️ in Italy.

---

## Contributors

A big thanks to all the people that contributed to improve this package. Any contribution is welcome. Do you have an idea to make this improve or something to say? Open a topic in the issues and we'll discuss together! Thank you ❤️
Also a big big big big thank you to all the financial contributors, which help me maintain the development of this package ❤️!

### Code Contributors

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
