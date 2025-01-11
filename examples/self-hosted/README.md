# Examples

This is examples folder. These examples are used to test new features and as sample showcases.

Each example owns an endpoint where a pass can be reached. This project is built upon Express.js.

Typescript compilation is done automatically through `tsx`.

Before generating a new pass, you'll have to override the `passTypeIdentifier` and `teamIdentifier` for them to match the data in your certificates. This can be done in two ways:

    a) Edit manually the `pass.json` of the model you are going to run;
    b) Pass the two fields in the query string of the example you are running when querying it;

Omitting this step, will make your pass unopenable.

Install the dependencies from wherever path you are with `pnpm install`. Installing the dependencies will link passkit-generator in the parent workspace, so to reflect any change, it will be enough to build passkit-generator and restart the example.

Then be sure to be placed in this folder (`examples/self-hosted`) and run this command to run the web server:

```sh
$ pnpm example;
```

Certificates paths in examples are linked to a folder `certificates` in the root of this project which is not provided.
To make them work, you'll have to edit both certificates and model path.

Every example runs on `0.0.0.0:8080`. Visit `http://localhost:8080/:example/:modelName`, by replacing `:example` with one of the following and `:modelName` with one inside models folder.

Please note that `field.js` example is hardcoded to download `exampleBooking.pass`.

| Example name   | Endpoint name     | Additional notes                                                                                                            |
| -------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| localize       | `/localize`       | -                                                                                                                           |
| fields         | `/fields`         | -                                                                                                                           |
| expirationDate | `/expirationDate` | Accepts a required parameter in query string `fn`, which can be either `expiration` or `void`, to switch generated example. |
| scratch        | `/scratch`        | -                                                                                                                           |
| PKPass.from    | `/pkpassfrom`     | -                                                                                                                           |
| barcodes       | `/barcodes`       | Using `?alt=true` query parameter, will lead to barcode string message usage instead of selected ones                       |
| pkpasses       | `/pkpasses`       | -                                                                                                                           |

---

Every contribution is really appreciated. ❤️ Thank you!
