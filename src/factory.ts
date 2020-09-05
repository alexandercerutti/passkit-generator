import { Pass } from "./pass";
import { FactoryOptions, BundleUnit, FinalCertificates } from "./schema";
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
	options: FactoryOptions | AbstractModel,
	additionalBuffers?: BundleUnit,
	abstractMissingData?: Omit<AbstractFactoryOptions, "model">
): Promise<Pass> {
	if (!(options && (options instanceof AbstractModel || Object.keys(options).length))) {
		throw new Error(formatMessage("CP_NO_OPTS"));
	}

	try {
		if (options instanceof AbstractModel) {
			let certificates: FinalCertificates;

			if (!(options.certificates && options.certificates.signerCert && options.certificates.signerKey) && abstractMissingData.certificates) {
				certificates = Object.assign(
					options.certificates,
					await readCertificatesFromOptions(abstractMissingData.certificates)
				);
			} else {
				certificates = options.certificates;
			}

			if (additionalBuffers) {
				const [additionalL10n, additionalBundle] = splitBufferBundle(additionalBuffers);
				Object.assign(options.bundle["l10nBundle"], additionalL10n);
				Object.assign(options.bundle["bundle"], additionalBundle);
			}

			return new Pass({
				model: options.bundle,
				certificates: certificates,
				overrides: {
					...(options.overrides || {}),
					...(abstractMissingData && abstractMissingData.overrides || {})
				}
			});
		} else {
			const [bundle, certificates] = await Promise.all([
				getModelContents(options.model),
				readCertificatesFromOptions(options.certificates)
			]);

			if (additionalBuffers) {
				const [additionalL10n, additionalBundle] = splitBufferBundle(additionalBuffers);
				Object.assign(bundle["l10nBundle"], additionalL10n);
				Object.assign(bundle["bundle"], additionalBundle);
			}

			return new Pass({
				model: bundle,
				certificates,
				overrides: options.overrides
			});
		}
	} catch (err) {
		throw new Error(formatMessage("CP_INIT_ERROR", "pass", err));
	}
}
