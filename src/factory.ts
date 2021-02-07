import { Pass } from "./pass";
import { FactoryOptions, BundleUnit, FinalCertificates, PartitionedBundle, OverridesSupportedOptions } from "./schema";
import formatMessage from "./messages";
import { getModelContents, readCertificatesFromOptions } from "./parser";
import { splitBufferBundle } from "./utils";
import { AbstractModel, AbstractFactoryOptions } from "./abstract";

/**
 * Creates a new Pass instance.
 *
 * @param options Options to be used to create the instance or an Abstract Model reference
 * @param additionalBuffers More buffers (with file name) to be added on runtime (if you are downloading some files from the web)
 * @param abstractMissingData Additional data for abstract models, that might vary from pass to pass.
 */

export async function createPass(
	options: FactoryOptions | InstanceType<typeof AbstractModel>,
	additionalBuffers?: BundleUnit,
	abstractMissingData?: Omit<AbstractFactoryOptions, "model">
): Promise<Pass> {
	if (!(options && (options instanceof AbstractModel || Object.keys(options).length))) {
		throw new Error(formatMessage("CP_NO_OPTS"));
	}

	try {
		if (options instanceof AbstractModel) {
			let certificates: FinalCertificates;
			let overrides: OverridesSupportedOptions = {
				...(options.overrides || {}),
				...(abstractMissingData && abstractMissingData.overrides || {})
			};

			if (!(options.certificates && options.certificates.signerCert && options.certificates.signerKey) && abstractMissingData.certificates) {
				certificates = Object.assign(
					options.certificates,
					await readCertificatesFromOptions(abstractMissingData.certificates)
				);
			} else {
				certificates = options.certificates;
			}

			return createPassInstance(options.bundle, certificates, overrides, additionalBuffers);
		} else {
			const [bundle, certificates] = await Promise.all([
				getModelContents(options.model),
				readCertificatesFromOptions(options.certificates)
			]);

			return createPassInstance(bundle, certificates, options.overrides, additionalBuffers);
		}
	} catch (err) {
		throw new Error(formatMessage("CP_INIT_ERROR", "pass", err));
	}
}

function createPassInstance(model: PartitionedBundle, certificates: FinalCertificates, overrides: OverridesSupportedOptions, additionalBuffers?: BundleUnit) {
	if (additionalBuffers) {
		const [additionalL10n, additionalBundle] = splitBufferBundle(additionalBuffers);
		Object.assign(model["l10nBundle"], additionalL10n);
		Object.assign(model["bundle"], additionalBundle);
	}

	return new Pass({
		model,
		certificates,
		overrides
	});
}
