import { Pass } from "./pass";
import { FactoryOptions, BundleUnit } from "./schema";
import formatMessage from "./messages";
import { getModelContents, readCertificatesFromOptions } from "./parser";
import { splitBundle } from "./utils";

export type Pass = InstanceType<typeof Pass>

export async function createPass(options: FactoryOptions, additionalBuffers?: BundleUnit): Promise<Pass> {
	if (!(options && Object.keys(options).length)) {
		throw new Error(formatMessage("CP_NO_OPTS"));
	}

	try {
		const [bundle, certificates] = await Promise.all([
			getModelContents(options.model),
			readCertificatesFromOptions(options.certificates)
		]);

		if (additionalBuffers) {
			const [ additionalL10n, additionalBundle ] = splitBundle(additionalBuffers);
			Object.assign(bundle["l10nBundle"], additionalL10n);
			Object.assign(bundle["bundle"], additionalBundle);
		}

		return new Pass({
			model: bundle,
			certificates,
			overrides: options.overrides
		});
	} catch (err) {
		throw new Error(formatMessage("CP_INIT_ERROR", err));
	}
}
