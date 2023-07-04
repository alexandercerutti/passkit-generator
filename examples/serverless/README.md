# Serverless Examples

This is a sample project for showing passkit-generator being used on cloud functions.

Typescript compilation happens automatically through `serverless-plugin-typescript` when serverless is started.

Before generating a new pass, you'll have to override the `passTypeIdentifier` and `teamIdentifier` for them to match the data in your certificates. This can be done in two ways:

    a) Edit manually the `pass.json` of the model you are going to run;
    b) Pass the two fields in the query string of the example you are running when querying it;

Omitting this step, will make your pass unopenable.

## Configuration

These examples are basically made for being executed locally. In the file `config.json`, some constants can be customized.

```json
	/** Passkit signerKey passphrase **/
	"SIGNER_KEY_PASSPHRASE": "123456",

	/** Bucket name where a pass is saved before being served. */
	"PASSES_S3_TEMP_BUCKET": "pkge-test",

	/** S3 Access key ID - "S3RVER" is default for `serverless-s3-local`. If this example is run offline, "S3RVER" will always be used. */
	"ACCESS_KEY_ID": "S3RVER",

	/** S3 Secret - "S3RVER" is default for `serverless-s3-local` */
	"SECRET_ACCESS_KEY": "S3RVER",

	/** Bucket that contains pass models **/
	"MODELS_S3_BUCKET": "pkge-mdbk"
```

## Run examples

Install the dependencies and run serverless. Installing the dependencies will link the latest version of passkit-generator in the parent workspace.

```sh
$ npm install;
$ npm run example;
```

This will start `serverless offline` with an additional host option (mainly for WSL environment).
Serverless will start, by default, on `0.0.0.0:8080`.

### Available examples

All the examples, except fields ones, require a `modelName` to be passed in queryString. The name will be checked against local FS or S3 bucket if example is deployed.
Pass in queryString all the pass props you want to apply them to the final result.

| Example name   | Endpoint name     | Additional notes                                                                                                                  |
| -------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| localize       | `/localize`       | -                                                                                                                                 |
| fields         | `/fields`         | -                                                                                                                                 |
| expirationDate | `/expirationDate` | -                                                                                                                                 |
| scratch        | `/scratch`        | -                                                                                                                                 |
| barcodes       | `/barcodes`       | Using `?alt=true` query parameter, will lead to barcode string message usage instead of selected ones                             |
| pkpasses       | `/pkpasses`       | This example shows how to upload the pkpasses file on S3, even if it is discouraged. It has been done just to share the knowledge |
