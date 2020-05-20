# Serverless (lambda) passes generation example

This folder contains a full project with setup instructions to run a working lambda on AWS through serverless. The project is written in Typescript, so it will require you to compile it.

## Initialization

Install the dependencies:

```sh
$ git clone https://github.com/alexandercerutti/passkit-generator.git;
$ cd examples/serverless;
$ npm install
```

This project uses the latest `passkit-generator` version available on the npm registry. It is not suitable for testing changes of the package.

## AWS and Lambda setup

- **To be written. Insert clear instructions and links to services references.**
- **Setup should not talk about registering an AWS Account**

## Running

- **To be written**
- **Insert certificates folder note (they are not included in the project**
- **Insert note about model, if we'll move it outside the folder?**
- **Are there some tests that can be done locally?**

## Deployment

To deploy the lambda to a AWS, we make use of serverless framework.

Serverless docs: https://www.serverless.com/framework/docs/getting-started/

Compile from Typescript the project and deploy it. It will be deployed according to details in `serverless.yml`.

```sh
$ npm run build
$ serverless deploy
```

Check for stack deploy status in CloudFormation. Once deployed check Lambda, CloudWatch and API GW to test and debug.
Go to the endpoint created in API GW to download the *.pkpass file.

___

Every contribution is really appreciated. ❤️ Thank you!
