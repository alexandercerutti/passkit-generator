import { Pass } from "./pass";
import { FactoryOptions } from "./schema";
import formatMessage from "./messages";
import { getModelContents, readCertificatesFromOptions } from "./parser";

export type Pass = InstanceType<typeof Pass>

export async function createPass(options: FactoryOptions): Promise<Pass> {
	if (!(options && Object.keys(options).length)) {
		throw new Error(formatMessage("CP_NO_OPTS"));
	}

	try {
		const [bundle, certificates] = await Promise.all([
			getModelContents(options.model),
			readCertificatesFromOptions(options.certificates)
		]);

		return new Pass({
			model: bundle,
			certificates,
			overrides: options.overrides
		});
	} catch (err) {
		console.log(err);
		throw new Error(formatMessage("CP_INIT_ERROR"));
	}
}
