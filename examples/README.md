# Examples

This is examples folder. Each example is linked to webserver.js, which *requires* express.js to run.
Express.js **was not** inserted as dipendency.

```sh
git clone https://github.com/alexandercerutti/passkit-generator.git;
npm install;
npm install express;
cd examples;
node <the-example-you-want-to-execute>.js
```

Certificates paths in examples are linked to a folder `certificates` in the root of this project which is not provided.
To make them work, you'll have to edit both certificates and model path.

Generates pass will be generated at address [http://localhost:3000/gen/examplePass](http://localhost:3000/gen/examplePass);
___

Every contribution is really appreciated. ❤️ Thank you!
