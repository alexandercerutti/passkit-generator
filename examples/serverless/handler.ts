import { createPass } from "passkit-generator";
import { Handler } from "aws-lambda";
import * as path from "path";

// Lambda handler
export const generatePass: Handler = async (event, context, callback) => {
  const passName = "Bookingpass" + "_" + (new Date()).toISOString();

  try {
    //NOTE: using __dirname is required inside lambda

    const examplePass = await createPass({
      model: path.resolve(__dirname, "/models/exampleBooking"),
      certificates: {
        wwdr: path.resolve(__dirname, "/certs/wwdr.pem"),
        signerCert: path.resolve(__dirname, "/certs/signercert.pem"),
        signerKey: {
          keyFile: path.resolve(__dirname, "/certs/signerkey.pem"),
          passphrase: "123456"
        }
      },
      overrides: {
        // keys to be added or overridden
        serialNumber: "AAGH44625236dddaffbda"
      }
    });


    // Generate the stream, which gets returned through a Promise
    const stream = examplePass.generate();

    // Important: this is needed for API GW to work
    const pass = stream.toString();

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Content-type": "application/vnd.apple.pkpass",
        "Content-disposition": `attachment; filename=${passName}.pkpass`
      },
      body: pass,
      isBase64Encoded: true
    };

    // To debug in Cloudwatch
    console.log(response);
    callback(null, response);

    return response;
  } catch (error) {
    return {
      statusCode: 500,
      error: `Could not get: ${error.stack}`
    };
  }
};
