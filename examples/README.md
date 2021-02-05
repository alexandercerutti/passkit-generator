# Examples

This is examples folder. These examples are used to test new features and as sample showcases.

Each example is linked to webserver.js, which *requires* express.js to run.
Express.js has been inserted as "example package" dipendency.

```sh
$ git clone https://github.com/alexandercerutti/passkit-generator.git;
$ cd passkit-generator && npm install;
$ cd examples && npm install;
$ npm run build;
$ npm run example <the-example-you-want-to-execute>.js
```

Certificates paths in examples are linked to a folder `certificates` in the root of this project which is not provided.
To make them work, you'll have to edit both certificates and model path.

Visit [http://localhost:8080/gen/examplePass](http://localhost:8080/gen/examplePass) to get the pass. Replace "examplePass" with the pass name in models folder.
Please note that `field.js` example will force you to download `exampleBooking.pass`, no matter what.
___

Every contribution is really appreciated. ❤️ Thank you!
