const functions = require("firebase-functions");
const { PKPass } = require("passkit-generator");
const admin = require("firebase-admin");
var fs = require('file-system');
var path = require('path');
var axios = require('axios');
var os = require('os');

// Firebase init
admin.initializeApp({
    credential: admin.credential.cert(require("CERTIFICATE_PATH")),
    storageBucket: "STORAGE_BUCKET_URL"
});
var storageRef = admin.storage().bucket()

exports.pass = functions.https.onRequest((request, response) => {
    PKPass.from({
        // Get relevant pass model from model folder (see passkit-generator/examples/models/)
        model: `./model/${request.body.passType}.pass`,
        certificates: {
            // Assigning certificates from certs folder (you will need to provide these yourself)
            wwdr: fs.fs.readFileSync("./certs/wwdr.pem"),
            signerCert: fs.fs.readFileSync("./certs/signerCert.pem"),
            signerKey: fs.fs.readFileSync("./certs/signerKey.pem"),
            signerKeyPassphrase: "PASSPHRASE"
        }, 
    },
        {
            authenticationToken: "AUTH_TOKEN",
            webServiceURL: "https://us-central1-YOUR-FUNCTION.cloudfunctions.net/FUNCTION_NAME",
            serialNumber: request.body.serialNumber,
            description: "DESCRIPTION",
            logoText: request.body.logoText,
            foregroundColor: request.body.textColor,
            backgroundColor: request.body.backgroundColor,
            labelColor: request.body.labelColor
        })
        .then(async (newPass) => {

            let currentPassType = request.body.passType;

            if (currentPassType == "boardingPass") {
                newPass.transitType = `PKTransitType${request.body.transitType}`;
            }

            if (request.body.relevantDate !== "Blank") {
                newPass.setRelevantDate(new Date(request.body.relevantDate));
            }

            if (request.body.expiryDate !== "Blank") {
                newPass.setExpirationDate(new Date(request.body.expiryDate));
            }

            if (request.body.relevantLocationLat !== "Blank" && request.body.relevantLocationLong !== "Blank") {
                newPass.setLocations({latitude: request.body.relevantLocationLat, longitude: request.body.relevantLocationLong});
            }

            request.body.header.forEach((field, index) => {
                if (field.label !== '' || field.value !== '') {
                    newPass.headerFields.push({
                        key: `header${index}`,
                        label: field.label,
                        value: field.value,
                    });
                }
                });

            request.body.primary.forEach((field, index) => {
                if (field.label !== '' || field.value !== '') {
                    newPass.primaryFields.push({
                        key: `primary${index}`,
                        label: field.label,
                        value: (currentPassType == "boardingPass") ? field.value.toUpperCase() : field.value,
                    });
                }
                });

            request.body.secondary.forEach((field, index) => {
            if (field.label !== '' || field.value !== '') {
                newPass.secondaryFields.push({
                    key: `secondary${index}`,
                    label: field.label,
                    value: field.value,
                    textAlignment: (index === request.body.secondary.length - 2 || index === request.body.secondary.length - 1) ? "PKTextAlignmentRight" : "PKTextAlignmentLeft",
                });
            }
            });

            request.body.auxiliary.forEach((field, index) => {
                if (field.label !== '' || field.value !== '') {
                    newPass.auxiliaryFields.push({
                        key: `auxiliary${index}`,
                        label: field.label,
                        value: field.value,
                        textAlignment: (index === request.body.secondary.length - 2 || index === request.body.secondary.length - 1) ? "PKTextAlignmentRight" : "PKTextAlignmentLeft",
                    });
                }
                });

            if (!request.body.codeAlt || request.body.codeAlt.trim() === "") {
                newPass.setBarcodes({
                    message: request.body.qrText,
                    format: `PKBarcodeFormat${request.body.codeType}`,
                    messageEncoding: "iso-8859-1",
                });
            } else {
                newPass.setBarcodes({
                    message: request.body.qrText,
                    format: `PKBarcodeFormat${request.body.codeType}`,
                    messageEncoding: "iso-8859-1",
                    altText: request.body.codeAlt,
                });
            }
            
            // Downloading thumbnail and logo files from Firebase Storage and adding to pass
            if (currentPassType == "generic" || currentPassType == "eventTicket") {
                const thumbnailFile = request.body.thumbnailFile
                const tempPath1 = path.join(os.tmpdir(), thumbnailFile)
                try {
                    await storageRef.file(`thumbnails/${thumbnailFile}`).download({destination: tempPath1})
                } catch (error) {
                    //
                }
                let buffer = Buffer.alloc(0);
                try {
                    buffer = fs.readFileSync(tempPath1)
                } catch (error) {
                    //
                }
                newPass.addBuffer("thumbnail.png", buffer)
                newPass.addBuffer("thumbnail@2x.png", buffer)
            }

            const logoFile = request.body.logoFile
            const tempPath2 = path.join(os.tmpdir(), logoFile)
            try {
                await storageRef.file(`logos/${logoFile}`).download({destination: tempPath2})
            } catch (error) {
                //
            }
            let buffer = Buffer.alloc(0);
            try {
                buffer = fs.readFileSync(tempPath2)
            } catch (error) {
                //
            }
            newPass.addBuffer("logo.png", buffer)
            newPass.addBuffer("logo@2x.png", buffer)
            

            const bufferData = newPass.getAsBuffer();
            try {
                console.log("Pass was uploaded successfully.");
                response.set('Content-Type', newPass.mimeType);
                response.status(200).send(bufferData);

                // Delete thumbnail file in Firebase Storage
                storageRef.file(`thumbnails/${thumbnailFile}`).delete().then(() => {
                    console.log('Thumbnail file deleted successfully');
                }).catch((err) => {
                    console.error(err);
                })

                // Delete logo file in Firebase Storage
                storageRef.file(`logos/${logoFile}`).delete().then(() => {
                    console.log('Logo file deleted successfully');
                }).catch((err) => {
                    console.error(err);
                })

            } catch (error) {
                console.log("Error Uploading pass " + error);
                response.send({
                    "explanation": error.message,
                    "result": "FAILED",
                });
            }
        })
});