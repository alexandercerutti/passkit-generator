/*
 * Generic webserver instance for the examples
 * @Author Alexander P. Cerutti
 * Requires express to run
 */

import express from "express";
import { promises as fs } from "fs";
import path from "path";
export const app = express();

app.use(express.json());

app.listen(8080, "0.0.0.0", () => {
	console.log("Webserver started.");
});

app.all("/", function (_, response) {
	response.redirect("/gen/");
});

app.route("/gen").all((req, res) => {
	res.set("Content-Type", "text/html");
	res.send(
		"Cannot generate a pass. Specify a modelName in the url to continue. <br/>Usage: /gen/<i>modelName</i>",
	);
});

export default app.route("/gen/:modelName");
const certificatesCache: Partial<{
	signerCert: Buffer;
	signerKey: Buffer;
	wwdr: Buffer;
	signerKeyPassphrase: string;
}> = {};

export async function getCertificates(): Promise<typeof certificatesCache> {
	if (Object.keys(certificatesCache).length) {
		return certificatesCache;
	}

	const [signerCert, signerKey, wwdr, signerKeyPassphrase] =
		await Promise.all([
			fs.readFile(
				path.resolve(__dirname, "../../certificates/signerCert.pem"),
				"utf-8",
			),
			fs.readFile(
				path.resolve(__dirname, "../../certificates/signerKey.pem"),
				"utf-8",
			),
			fs.readFile(
				path.resolve(__dirname, "../../certificates/WWDR.pem"),
				"utf-8",
			),
			Promise.resolve("123456"),
		]);

	Object.assign(certificatesCache, {
		signerCert,
		signerKey,
		wwdr,
		signerKeyPassphrase,
	});

	return certificatesCache;
}
