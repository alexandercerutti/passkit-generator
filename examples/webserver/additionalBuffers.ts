/**
 * Example for adding additional buffers to the
 * model. These buffers, represent contents that
 * get fetched in runtime and that may vary
 * at any time, for any reason.
 * For the example purposes, we are using a static URL.
 */

import app from "./webserver";
import fetch from "node-fetch";
import { createPass } from "../..";

app.all(async function manageRequest(request, response) {
	let passName = request.params.modelName + "_" + (new Date()).toISOString().split('T')[0].replace(/-/ig, "");

	const avatar = await (
		fetch("https://s.gravatar.com/avatar/83cd11399b7ea79977bc302f3931ee52?size=32&default=retro")
			.then(res => res.buffer())
	);

	const passConfig = {
		model: `./models/${request.params.modelName}`,
		certificates: {
			wwdr: "../certificates/WWDR.pem",
			signerCert: "../certificates/signerCert.pem",
			signerKey: {
				keyFile: "../certificates/signerKey.pem",
				passphrase: "123456"
			}
		},
		overrides: request.body || request.params || request.query,
	};

	const additionalBuffers = {
		"thumbnail@2x.png": avatar,
		// If we are using L10N folders, we can set the content like this
		"en.lproj/thumbnail@2x.png": avatar,
	};

	try {
		const pass = await createPass(passConfig, additionalBuffers);

		const stream = pass.generate();

		response.set({
			"Content-type": "application/vnd.apple.pkpass",
			"Content-disposition": `attachment; filename=${passName}.pkpass`
		});

		stream.pipe(response);
	} catch (err) {
		console.log(err);

		response.set({
			"Content-type": "text/html",
		});

		response.send(err.message);
	}
});
