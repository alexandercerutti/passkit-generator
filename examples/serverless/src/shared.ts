import { ALBEvent, ALBResult } from "aws-lambda";
import AWS from "aws-sdk";
import { promises as fs } from "fs";
import path from "path";
import config from "../config.json";
import { PKPass } from "passkit-generator";

const S3: { instance: AWS.S3 } = { instance: undefined };

export function finish400WithoutModelName(event: ALBEvent) {
	if (event.queryStringParameters?.modelName) {
		return;
	}

	return {
		statusCode: 400,
		body: JSON.stringify({
			message: "modelName is missing in query params",
		}),
	};
}

export function getRandomColorPart() {
	return Math.floor(Math.random() * 255);
}

export async function getModel(
	modelName: string,
): Promise<string | { [key: string]: Buffer }> {
	if (process.env.IS_OFFLINE === "true") {
		console.log("model offline retrieving");
		return path.resolve(__dirname, `../../models/${modelName}`);
	}

	const s3 = await getS3Instance();

	const result = await s3
		.getObject({ Bucket: config.MODELS_S3_BUCKET, Key: modelName })
		.promise();

	return {}; // @TODO, like when it is run on s3
}

export async function getCertificates(): Promise<{
	signerCert: string | Buffer;
	signerKey: string | Buffer;
	wwdr: string | Buffer;
	signerKeyPassphrase?: string;
}> {
	let signerCert: string;
	let signerKey: string;
	let wwdr: string;
	let signerKeyPassphrase: string;

	if (process.env.IS_OFFLINE) {
		console.log("Fetching Certificates locally");

		[signerCert, signerKey, wwdr, signerKeyPassphrase] = await Promise.all([
			fs.readFile(
				path.resolve(__dirname, "../../../certificates/signerCert.pem"),
				"utf-8",
			),
			fs.readFile(
				path.resolve(__dirname, "../../../certificates/signerKey.pem"),
				"utf-8",
			),
			fs.readFile(
				path.resolve(__dirname, "../../../certificates/WWDR.pem"),
				"utf-8",
			),
			Promise.resolve(config.SIGNER_KEY_PASSPHRASE),
		]);
	} else {
		// @TODO
	}

	return {
		signerCert,
		signerKey,
		wwdr,
		signerKeyPassphrase,
	};
}

export async function getS3Instance() {
	if (S3.instance) {
		return S3.instance;
	}

	const instance = new AWS.S3({
		s3ForcePathStyle: true,
		accessKeyId: process.env.IS_OFFLINE ? "S3RVER" : config.ACCESS_KEY_ID, // This specific key is required when working offline
		secretAccessKey: config.SECRET_ACCESS_KEY,
		endpoint: new AWS.Endpoint("http://localhost:4569"),
	});

	S3.instance = instance;

	try {
		/** Trying to create a new bucket. If it fails, it already exists (at least in theory) */
		await instance
			.createBucket({ Bucket: config.PASSES_S3_TEMP_BUCKET })
			.promise();
	} catch (err) {}

	return instance;
}

export async function getSpecificFileInModel(
	fileName: string,
	modelName: string,
) {
	const model = await getModel(modelName);

	if (typeof model === "string") {
		return fs.readFile(path.resolve(`${model}.pass`, fileName));
	}

	return model[fileName];
}

export async function* createPassGenerator(
	modelName?: string,
	passOptions?: Object,
): AsyncGenerator<PKPass, ALBResult, PKPass> {
	const [template, certificates, s3] = await Promise.all([
		modelName ? getModel(modelName) : Promise.resolve({}),
		getCertificates(),
		getS3Instance(),
	]);

	let pass: PKPass;

	if (template instanceof Object) {
		pass = new PKPass(template, certificates, passOptions);
	} else if (typeof template === "string") {
		pass = await PKPass.from(
			{
				model: template,
				certificates,
			},
			passOptions,
		);
	}

	pass = yield pass;

	const buffer = pass.getAsBuffer();
	const passName = `GeneratedPass-${Math.random()}.pkpass`;

	const { Location } = await s3
		.upload({
			Bucket: config.PASSES_S3_TEMP_BUCKET,
			Key: passName,
			ContentType: pass.mimeType,
			/** Marking it as expiring in 5 minutes, because passes should not be stored */
			Expires: new Date(Date.now() + 5 * 60 * 1000),
			Body: buffer,
		})
		.promise();

	/**
	 * Please note that redirection to `Location` does not work
	 * if you open this code in another device if this is run
	 * offline. This because `Location` is on localhost. Didn't
	 * find yet a way to solve this.
	 */

	return {
		statusCode: 302,
		headers: {
			"Content-Type": "application/vnd.apple.pkpass",
			Location: Location,
		},
	};
}
