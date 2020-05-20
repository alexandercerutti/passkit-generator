# Webserver passes generation examples

Each example is linked to works through the usage of a common file `webserver.js`, which is built upon Express.js.
Express.js has been inserted as "example package" dipendency. For this reason, a package installation is required.

`Passkit-generator` will be picked from the parent directory and not as dependency. This because, these files are both used to test changes and as examples, so they require to access to the latest version.

### Certificates

Certificates paths in examples are linked to a folder `certificates` in the root of this project which is not provided.
To make them work, you'll have to edit both certificates and model path or create a new folder and insert the required content inside.

### Steps

```sh
$ git clone https://github.com/alexandercerutti/passkit-generator.git;
$ cd passkit-generator && npm install;
$ cd examples/webserver && npm install;
$ npm run build;
$ node <the-example-you-want-to-execute>.js
```

### Running

Visit [http://localhost:8080/gen/examplePass](http://localhost:8080/gen/examplePass) to get the pass. Replace "examplePass" with the pass name in models folder.
Some examples will have switches available through query strings. Refer to the single examples to see the parameters.
Please note that `field.js` example will force you to download `exampleBooking.pass`, no matter what (except if you change it, ofc.)

___

Every contribution is really appreciated. ❤️ Thank you!
