"use strict";
// const { createPass } = require("passkit-generator");
import { createPass, Pass } from "passkit-generator";

//Lambda handler
module.exports.createPass = async (event :any, context:any, callback:any) => {
  const passName = "Bookingpass"+ "_" + (new Date()).toISOString();
  
  try {
    const examplePass = await createPass({
      model: __dirname + "/models/exampleBooking", //NOTE:  __dirname notation is required inside lambda
      certificates: {
        wwdr:  __dirname + "/certs/wwdr.pem",
        signerCert:  __dirname + "/certs/signercert.pem",
        signerKey: {
          keyFile:  __dirname + "/certs/signerkey.pem",
          passphrase: "123456"
        }
      },
      overrides: {
        // keys to be added or overridden
        serialNumber: "AAGH44625236dddaffbda"
      }
    });
  

    // Generate the stream, which gets returned through a Promise 
    const stream = await examplePass.generate();
    const pass = await stream.toString('base64'); //Important needed for API GW to work

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
    console.log(response); //To debug in Cloudwatch
    callback(null, response);

    return response;
  } catch (error) {
    return {
      statusCode: 500,
      error: `Could not get: ${error.stack}`
    };
  }
};

