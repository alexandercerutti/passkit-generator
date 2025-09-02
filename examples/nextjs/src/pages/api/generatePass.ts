"use server";
import type { NextApiRequest, NextApiResponse } from "next";
import { PKPass } from "passkit-generator";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PASS_TYPE_ID = "pass.com.passkitgenerator";
const TEAM_IDENTIFIER = "F53WB8AE67";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const signerCert = fs.readFileSync(
	path.resolve(__dirname, "../../../../../certificates/certs/signerCert.pem"),
	"utf-8",
);

const signerKey = fs.readFileSync(
	path.resolve(__dirname, "../../../../../certificates/certs/signerKey.pem"),
	"utf-8",
);

const wwdr = fs.readFileSync(
	path.resolve(__dirname, "../../../../../certificates/WWDR.pem"),
	"utf-8",
);

const signerKeyPassphrase = "123456";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Buffer>,
) {
	const pass = await PKPass.from(
		{
			/**
			 * Path is relative to the `next.js` folder (example project root)
			 */
			model: "../models/exampleBooking.pass",
			certificates: {
				signerCert,
				signerKey,
				signerKeyPassphrase,
				wwdr,
			},
		},
		{
			serialNumber: `nmyuxofgna${Math.random()}`,
		},
	);

	pass.transitType = "PKTransitTypeAir";

	res.status(200)
		.setHeader("Content-Type", pass.mimeType)
		.setHeader(
			"Content-Disposition",
			`attachment; filename=pass-${Math.random()}.pkpass`,
		)
		.send(pass.getAsBuffer());
}
