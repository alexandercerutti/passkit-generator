# Serverless Example

To deploy the Pass-Kit to a AWS lambda we make use of serverless framework. 
Refer to serverless.yml for deployment details.

Serverless docs: https://www.serverless.com/framework/docs/getting-started/


# To deploy to AWS
```sh
$ cd examples\passKitServerless
$ npm install
$ serverless deploy
```

Check for stack deploy status in CloudFormation. Once deployed check Lambda, CloudWatch and API GW to test and debug.
Go to the endpoint created in API GW to download the *.pkpass file.

Thank you!