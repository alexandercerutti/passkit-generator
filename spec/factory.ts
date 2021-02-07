import { createPass } from "../lib/factory";
import formatMessage from "../lib/messages";
import * as fs from "fs";
import * as path from "path";

describe("createPass", () => {
	it("should throw if first argument is not provided", async () => {
		await expectAsync(createPass(undefined)).toBeRejectedWithError(
			formatMessage("CP_NO_OPTS")
		);
	});

	try {
		let certificatesPath = "../certificates";

		try {
			fs.accessSync(path.resolve(__dirname, certificatesPath));
		} catch (err) {
			certificatesPath = "../certs";

			try {
				fs.accessSync(path.resolve(__dirname, certificatesPath));
			} catch (err) {
				certificatesPath = "";
			}
		}

		if (certificatesPath) {
			it("should return a pass instance", async () => {
				await expectAsync(createPass({
					model: path.resolve(__dirname, "../examples/models/exampleBooking.pass"),
					certificates: {
						signerCert: path.resolve(__dirname, certificatesPath, "./signerCert.pem"),
						signerKey: {
							keyFile: path.resolve(__dirname, certificatesPath, "./signerKey.pem"),
							passphrase: "password1234"
						},
						wwdr: path.resolve(__dirname, certificatesPath, "./WWDR.pem"),
					}
				})).toBeResolved();
			});

			describe("Model validation", () => {
				it("Should reject with non valid model", async () => {
					await expectAsync(createPass({
						// @ts-expect-error
						model: 0,
						certificates: {
							signerCert: path.resolve(__dirname, certificatesPath, "./signerCert.pem"),
							signerKey: {
								keyFile: path.resolve(__dirname, certificatesPath, "./signerKey.pem"),
								passphrase: "password1234"
							},
							wwdr: path.resolve(__dirname, certificatesPath, "./WWDR.pem"),
						}
					})).toBeRejected();

					await expectAsync(createPass({
						model: undefined,
						certificates: {
							signerCert: path.resolve(__dirname, certificatesPath, "./signerCert.pem"),
							signerKey: {
								keyFile: path.resolve(__dirname, certificatesPath, "./signerKey.pem"),
								passphrase: "password1234"
							},
							wwdr: path.resolve(__dirname, certificatesPath, "./WWDR.pem"),
						}
					})).toBeRejected();

					await expectAsync(createPass({
						model: null,
						certificates: {
							signerCert: path.resolve(__dirname, certificatesPath, "./signerCert.pem"),
							signerKey: {
								keyFile: path.resolve(__dirname, certificatesPath, "./signerKey.pem"),
								passphrase: "password1234"
							},
							wwdr: path.resolve(__dirname, certificatesPath, "./WWDR.pem"),
						}
					})).toBeRejected();

					await expectAsync(createPass({
						model: {},
						certificates: {
							signerCert: path.resolve(__dirname, certificatesPath, "./signerCert.pem"),
							signerKey: {
								keyFile: path.resolve(__dirname, certificatesPath, "./signerKey.pem"),
								passphrase: "password1234"
							},
							wwdr: path.resolve(__dirname, certificatesPath, "./WWDR.pem"),
						}
					})).toBeRejected();
				});
			});
		}
	} catch (err) { }
});
