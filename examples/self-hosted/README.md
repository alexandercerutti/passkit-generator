# Examples

This is examples folder. These examples are used to test new features and as sample showcases.

Each example owns an endpoint where a pass can be reached. This project is build upon Express.js, which is required to be installed.

Typescript compilation is done automatically through `ts-node`.

Assuming you already have cloned this repository, installed its dependencies through `npm install` and moved to `examples/self-hosted`, run these commands:

```sh
$ npm install;
$ npm run example;
```

Certificates paths in examples are linked to a folder `certificates` in the root of this project which is not provided.
To make them work, you'll have to edit both certificates and model path.

Every example runs on `0.0.0.0:8080`. Visit `http://localhost:8080/:example/:modelName`, by replacing `:example` with one of the following and `:modelName` with one inside models folder.

Please note that `field.js` example will force you to download `exampleBooking.pass`, no matter what.

| Example name   | Endpoint name     | Additional notes                                                                                                            |
| -------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| localize       | `/localize`       | -                                                                                                                           |
| fields         | `/fields`         | -                                                                                                                           |
| expirationDate | `/expirationDate` | Accepts a required parameter in query string `fn`, which can be either `expiration` or `void`, to switch generated example. |
| scratch        | `/scratch`        | -                                                                                                                           |
| PKPass.from    | pkpassfrom        | -                                                                                                                           |
| barcodes       | `/barcodes`       | Using `?alt=true` query parameter, will lead to barcode string message usage instead of selected ones                       |
| pkpasses       | `/pkpasses`       | -                                                                                                                           |

---

Every contribution is really appreciated. ❤️ Thank you!
