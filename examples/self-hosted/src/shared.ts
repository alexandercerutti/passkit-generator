import fs from "node:fs/promises";
import path from "node:path";

interface Cache {
	certificates:
		| {
				signerCert: Buffer | string;
				signerKey: Buffer | string;
				wwdr: Buffer | string;
				signerKeyPassphrase: string;
		  }
		| undefined;
}

const cache: Cache = {
	certificates: undefined,
};

export async function getCertificates(): Promise<
	Exclude<Cache["certificates"], undefined>
> {
	if (cache.certificates) {
		return cache.certificates;
	}

	const [signerCert, signerKey, wwdr, signerKeyPassphrase] =
		await Promise.all([
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
			Promise.resolve("123456"),
		]);

	cache.certificates = {
		signerCert,
		signerKey,
		wwdr,
		signerKeyPassphrase,
	};

	return cache.certificates;
}
