import { Pass } from "./pass";
import { FactoryOptions, BundleUnit } from "./schema";
import formatMessage from "./messages";
import { getModelContents, readCertificatesFromOptions } from "./parser";

export type Pass = InstanceType<typeof Pass>

export async function createPass(options: FactoryOptions, additionalBuffers: BundleUnit): Promise<Pass> {
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
		throw new Error(formatMessage("CP_INIT_ERROR"));
	}
}

/**
 * Applies a partition to split one bundle
 * to two
 * @param origin
 */

function splitBundle(origin: Object): [BundleUnit, BundleUnit] {
	const keys = Object.keys(origin);
	return keys.reduce(([ l10n, bundle ], current) =>
		current.includes(".lproj") &&
		[ { ...l10n, [current]: origin[current] }, bundle] ||
		[ l10n, {...bundle, [current]: origin[current] }]
	, [{},{}]);
}
