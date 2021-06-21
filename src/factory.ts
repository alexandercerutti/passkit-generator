import { Pass } from "./pass";
import * as Schemas from "./schemas";
import formatMessage, { ERROR } from "./messages";
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
	options: Schemas.FactoryOptions | InstanceType<typeof AbstractModel>,
	additionalBuffers?: Schemas.BundleUnit,
	abstractMissingData?: Omit<AbstractFactoryOptions, "model">,
): Promise<Pass> {
	if (
		!(
			options &&
			(options instanceof AbstractModel || Object.keys(options).length)
		)
	) {
		throw new Error(formatMessage(ERROR.CP_NO_OPTS));
	}

	try {
		if (options instanceof AbstractModel) {
			let certificates: Schemas.CertificatesSchema;
			let overrides: Schemas.OverridesSupportedOptions = {
				...(options.overrides || {}),
				...((abstractMissingData && abstractMissingData.overrides) ||
					{}),
			};

			if (
				!(
					options.certificates &&
					options.certificates.signerCert &&
					options.certificates.signerKey
				) &&
				abstractMissingData.certificates
			) {
				certificates = Object.assign(
					options.certificates,
					await readCertificatesFromOptions(
						abstractMissingData.certificates,
					),
				);
			} else {
				certificates = options.certificates;
			}

			return createPassInstance(
				options.bundle,
				certificates,
				overrides,
				additionalBuffers,
			);
		} else {
			const [bundle, certificates] = await Promise.all([
				getModelContents(options.model),
				readCertificatesFromOptions(options.certificates),
			]);

			return createPassInstance(
				bundle,
				certificates,
				options.overrides,
				additionalBuffers,
			);
		}
	} catch (err) {
		throw new Error(formatMessage(ERROR.CP_INIT, "pass", err));
	}
}

function createPassInstance(
	model: Schemas.PartitionedBundle,
	certificates: Schemas.CertificatesSchema,
	overrides: Schemas.OverridesSupportedOptions,
	additionalBuffers?: Schemas.BundleUnit,
) {
	if (additionalBuffers) {
		const [additionalL10n, additionalBundle] =
			splitBufferBundle(additionalBuffers);
		Object.assign(model["l10nBundle"], additionalL10n);
		Object.assign(model["bundle"], additionalBundle);
	}

	return new Pass({
		model,
		certificates,
		overrides,
	});
}
