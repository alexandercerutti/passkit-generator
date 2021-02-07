import {
	Certificates,
	FinalCertificates,
	PartitionedBundle,
	OverridesSupportedOptions,
	FactoryOptions,
} from "./schema";
import { getModelContents, readCertificatesFromOptions } from "./parser";
import formatMessage from "./messages";

const abmCertificates = Symbol("certificates");
const abmModel = Symbol("model");
const abmOverrides = Symbol("overrides");

export interface AbstractFactoryOptions
	extends Omit<FactoryOptions, "certificates"> {
	certificates?: Certificates;
}

interface AbstractModelOptions {
	bundle: PartitionedBundle;
	certificates: FinalCertificates;
	overrides?: OverridesSupportedOptions;
}

/**
 * Creates an abstract model to keep data
 * in memory for future passes creation
 * @param options
 */

export async function createAbstractModel(options: AbstractFactoryOptions) {
	if (!(options && Object.keys(options).length)) {
		throw new Error(formatMessage("CP_NO_OPTS"));
	}

	try {
		const [bundle, certificates] = await Promise.all([
			getModelContents(options.model),
			readCertificatesFromOptions(options.certificates),
		]);

		return new AbstractModel({
			bundle,
			certificates,
			overrides: options.overrides,
		});
	} catch (err) {
		throw new Error(formatMessage("CP_INIT_ERROR", "abstract model", err));
	}
}

export class AbstractModel {
	private [abmCertificates]: FinalCertificates;
	private [abmModel]: PartitionedBundle;
	private [abmOverrides]: OverridesSupportedOptions;

	constructor(options: AbstractModelOptions) {
		this[abmModel] = options.bundle;
		this[abmCertificates] = options.certificates;
		this[abmOverrides] = options.overrides;
	}

	get certificates(): FinalCertificates {
		return this[abmCertificates];
	}

	get bundle(): PartitionedBundle {
		return this[abmModel];
	}

	get overrides(): OverridesSupportedOptions {
		return this[abmOverrides];
	}
}
