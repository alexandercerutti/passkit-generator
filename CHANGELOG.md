# Changelog

### 3.5.6 (27 Nov 2025)

-   Updated `node-forge` to v1.3.2 to address CVE-2025-12816 (PR #258)

---

### 3.5.5 (31 Oct 2025)

-   Fixed `venuePlaceID` typescript signature, which was marked as mandatory while Joi schema was marking it as optional (PR #256)
-   Added support to iOS 18.1 semantics fields `EventDateInfo.unannounced` and `EventDateInfo.undetermined`;
-   Added support to iOS 18.1 top level key `eventLogoText`;

---

### 3.5.3 (31 Oct 2025)

-   Fixed `UpcomingPassInformationEntry["backFields"]`: `backFields` was lowercase by mistake, leading it to its stripping (it is required for the new Poster Event Ticket upcoming events view to appear);

---

### 3.5.2 (15 Oct 2025)

-   Fixed support for Cloudflare workers by disabling tls email validation checks (PR #255)

---

### 3.5.0 (07 Oct 2025)

-   Added support to iOS 26 Changes. Refer to #249 for all the details.
    -   Added support for preferredStyleSchemes method to boardingPass value and pass type, in order to add the support to the new ✨ Semantic Boarding Passes ✨
    -   Added new setter and getter upcomingPassInformation to add details with validation;
    -   Deprecated type and schema Schemas.Field for Schemas.PassFieldContent;
    -   Set setRelevantDates to set both relevantDate and date in order to support both iOS 18 and iOS 26 – the property got renamed, bringing a breaking change;

---

### 3.4.0 (28 May 2025)

-   Added support to undocumented feature `stripColor` (PR #245)

---

### 3.3.0 (11 Jan 2025)

-   Added support to the missing iOS 18 changes (`useAutomaticColor`, `footerBackgroundColor`, `suppressHeaderDarkening`, `auxiliaryStoreIdentifiers`, `eventStartDateInfo`, `venueOpenDate`);
-   Added support to `relevantDate` property in `relevantDates`, along with `startDate` and `endDate`, in `pass.json`;
-   Added new method `setRelevantDates`;
-   Improved details on `(root).relevantDate` deprecation since iOS 18;
-   Improved comments and markers on SemanticTags with iOS version;
-   Added support to double compilation ESM + CJS: both are now shipped;
-   Updated examples. This update brings also them to run on ESM;
-   Made easier to run examples and install their dependency by converting repo to be a pnpm workspace;

---

### 3.2.0 (29 Oct 2024)

-   Added support to iOS 18 changes (refer to [issue #205](https://github.com/alexandercerutti/passkit-generator/issues/205) for all the changes);
-   Added support to hex colors for `foregroundColor`, `backgroundColor`, `labelColor` as well as new iOS 18 color properties;
-   Added new example models for iOS 18 changes;
-   Added inline source maps in files;
-   Fixed `Field.timeStyle` typescript type;
-   Changed all node imports to use `node:` prefix;
-   Changes `do-not-zip` usage make use of explict `node:buffer` import;

---

### 3.1.11 (15 Aug 2023)

-   Fixed beacons `major` validation to be more relaxed (PR #158);

---

### 3.1.10 (09 Aug 2023)

-   Fixed dates processing by converting them to UTC (PR #155);

---

### 3.1.9 (03 Apr 2023)

-   Fixed transitType which wasn't being imported when a boardingPass was getting read (PR #138)
-   Improved types for property in Field type (PR #139)

---

### 3.1.8 (26 Mar 2023)

-   Fixed Typescript type for Semantics.WifiAccess (PR #136)

---

### 3.1.7 (14 Nov 2022)

-   Fixed generation of EventTicket with row fields (PR #118)

---

### 3.1.6 (29 Mar 2022)

-   Optimizations for localizationEntries, PKPass.pack, localize and regexes;
-   Dependencies Update;

---

### 3.1.5 (22 Feb 2022)

-   Fixed FieldsArray order when pushing or unshifting fields in `headerFields`, `primaryFields`, `secondaryFields`, `auxiliaryFields` and `backFields` (PR #104)

---

### 3.1.4 (07 Feb 2022)

-   Fixed Schema validation for browser-like contexts like Cloudflare Workers (PR #100);

-   Added examples for Cloudflare Workers;

---

### 3.1.3 (16 Jan 2022)

-   Updated dependencies to remove dependabot alerts (like, node-forge to v1.2.1);
-   Updated tests;

---

### 3.1.2 (30 Dec 2021 (Happy new year!))

-   This release fixes some issues when running under Windows and adds new tests.
-   Thanks to PR #99 by d34db4b3.

---

### 3.1.1 (25 Dec 2021 (Merry Christmas!))

-   This release fixes some issues with typescript strict mode (as much as we were able to fix without starting ho-ho-ho-ing due to madness 🤪).

---

### 3.1.0 (11 Dec 2021)

-   Made `PKPass.from` Template `certificates` to be optional;
-   Changed constructor buffers and certificates to be optional;
-   Added constructor check on certificates to avoid error if pass is created through `PKPass.from` but without certificates;
-   Added constructor checks for buffers with a warning being fired if the passed parameter is not an object;

---

### 3.0.0 / 3.0.1 (31 Oct 2021)

-   Passkit-generator has been completely refactored and re-conceptualized. Follow [Migration Guide v2 to v3](https://github.com/alexandercerutti/passkit-generator/wiki/Migrating-from-v2-to-v3) to see the differences between the two versions

---

### 2.0.8 (25 Aug 2021)

-   Added support for optional NFC key `requiresAuthentication`;
-   Added support for semantics as a global overridable property;
-   Renamed files to conform to Apple naming in documentation;
-   Added documentation links in files;

---

### 2.0.7 (21 Jun 2021)

-   Fixed wrong Schemas keys (`ignoresTimeZone` and `dataDetectorTypes`);
-   Added more SemanticsTagTypes
-   Refactored Error system;
-   Refactored Schemas;
-   Updated Dependencies;
-   Removed unnecessary ways to perfom ways in refactoring;

---

### 2.0.6 (09 Feb 2021)

-   Improved building phase;
-   Improved tests;
-   Updated dependencies (like node-forge and node-fetch, which had critical vulnerability);
-   Added prettier for formatting;
-   Generic improvements to code;
-   Removed moment.js for an internal generation of the date (without timezone support);

---

### 2.0.5 (06 Sep 2020)

-   Replaced deprecated dependencies `@hapi/joi` with Sideway's joi;
-   Generic dependencies update;
-   Generic code improvements (vscode-autofixes included);
-   Bumped minimum Node.JS supported version to 10 (moved from `util.promisify` approach to `fs.promises`);

---

### 2.0.4 (14 Dec 19)

-   Typescript strict configuration fixes;
-   Improved specifications;

---

### 2.0.3 (06 Dec 19)

-   Dependencies Updates;
-   More improvements;

---

### 2.0.2

-   Unlocked some other prohibited (until now) fields that were not editable due to design choice ( `organizationName`, `passTypeIdentifier`, `teamIdentifier`, `appLaunchURL`, `associatedStoreIdentifiers`);
-   Small improvements;

---

### 2.0.1

-   Typescript version update;
-   Update to webServiceURL schema regex and allowed all characters for authenticationToken;

---

### 2.0.0

This version brings lot of improvements and breaking changes.
Please refer to the [Migration Guide](https://github.com/alexandercerutti/passkit-generator/wiki/Migrating-from-v1-to-v2) for the most important changes.

---

### 1.6.8

-   Added optional `row` attribute for `auxiliaryFields`

---

### 1.6.6

-   Fixed problem with fieldsArray: fields were being added even if the keys check was failing

---

### 1.6.5

-   Added support for `logoText` in `supportedOptions` (issues #21, #28)
-   Fixed nfc methods which was accepting and registering an array instead of an object
-   Adding support for native Dates (#32)
-   Fixing passes parallel generation (#31)

---

### 1.6.4

-   Added windows path slash parsing

---

### 1.6.3

-   Moved some utility functions to a separate file
-   Removed rgbValues as a variable for a direct approact
-   Renamed `_validateType` in `_hasValidType`
-   Fixed barcode legacy bug
-   Added NO_PASS_TYPE as message
-   Moved passExtractor function to class scope instead of generate()'s
-   Moved to async/await approach for generate()

---

### 1.6.0

-   Improved unique fields management;
-   Changed debug message for discarded fields;
-   Renamed uniqueKeys to fieldsKeys
-   Added `BRC_BW_FORMAT_UNSUPPORTED` to not let `PKBarcodeFormatCode128` to be used as backward barcode format
-   Added support for row field in `auxiliaryFields`
-   Added support to `semantics` keys to fields in schema

---

### 1.5.9

-   Removed check for changeMessage as per issue topic #15
-   Added pass.strings file concatenation with translations if it already exists
    in specific folder;
-   Small changes to messages;

---

### 1.5.8

-   Now checking both static list and remote list before raising the error for missing files
-   (thank you, Artsiom Aliakseyenka);
-   Renamed `__barcodeAutogen` to barcodesFromUncompleteData and moved it outside of Pass class;
-   Renamed `__barcodeAutocomplete` to `Symbol/barcodesFillMissing`;
-   Renamed `__barcodeChooseBackward` to `Symbol/barcodesSetBackward`;
-   Removed context binding when passing above methods with alises after using .barcode();
-   Edited BRC_ATC_MISSING_DATA message

---

### 1.5.7

-   Moved tests to spec folder with jasmine configuration
-   Fixed barcodes validation problem
-   Re-engineered FieldContainer (now FieldsArray) to extend successfully array with its methods.

---

### 1.5.6

-   Updated documentation
-   Added content-certificates support;
-   Fixed problem with supported options
-   Added description to be available for override (thank you, Artsiom Aliakseyenka);

---

### 1.5.5

-   Schema: changed `webServiceURL` Regex and `authenticationToken` binding to this one
-   Schema: removed filter function for getValidated to return empty object in case of error;
-   Added `OVV_KEYS_BADFORMAT` message to throw in case of error;

---

### 1.5.4

-   Added .npmignore to exclude examples upload
-   Replaced findIndex for find to get directly the pass type.
-   Added function assignLength to wrap new objects with length property.
-   Converted schemas arrow functions to functions and added descriptive comments.
-   Added noop function instead creating new empty functions.

---

### 1.5.3

-   Bugfix: when overrides is not passed as option, the pass does not get generated.

---

### 1.5.2

-   Added schema support for sharingProhibited (not documented in ppfr)

---

### 1.5.1

-   Updated declaration file
-   Fixed problem in error message resolving on multiple %s;
-   Added debug messages in messages.js;
-   Added more comments;
-   Moved literal debug messages to messages.js;
-   Edited formatMessage (was formatError) to check also among debugMessages

---

### 1.5.0

-   Moved `_parseCertificates` outside of pass and renamed it in readCertificates;
-   Changed `readCertificates` to return object containing name:parsed-pem;
-   Added `readCertificates` and `this.Certificates` merging before model reading;

---

### 1.4.2

-   Minor changes to READMEs and core.
-   Updated documentation

---

### 1.4.1

-   Fix model initialization validation
-   Improved README
-   Added logo in assets and README
-   Added updates for OpenSSL for Windows in termal steps for cers generation
-   Updated dependencies minimum version

---

### 1.4.0

-   Added working example for load
-   Fix typos for non-mac guide
-   Removed `express` from dev dependencies;
-   Added `.load` type definition
-   Added `.load` to documentation;
-   Added `.load` function to fetch pictures from the web and implemented fetching function inside logic flow
