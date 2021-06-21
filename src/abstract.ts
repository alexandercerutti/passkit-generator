import * as Schemas from "./schemas";
import { getModelContents, readCertificatesFromOptions } from "./parser";
import formatMessage, { ERROR } from "./messages";

const abmCertificates = Symbol("certificates");
const abmModel = Symbol("model");
const abmOverrides = Symbol("overrides");

export interface AbstractFactoryOptions
	extends Omit<Schemas.FactoryOptions, "certificates"> {
	certificates?: Schemas.Certificates;
}

interface AbstractModelOptions {
	bundle: Schemas.PartitionedBundle;
	certificates: Schemas.CertificatesSchema;
	overrides?: Schemas.OverridesSupportedOptions;
}

/**
 * Creates an abstract model to keep data
 * in memory for future passes creation
 * @param options
 */

export async function createAbstractModel(options: AbstractFactoryOptions) {
	if (!(options && Object.keys(options).length)) {
		throw new Error(formatMessage(ERROR.CP_NO_OPTS));
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
		throw new Error(formatMessage(ERROR.CP_INIT, "abstract model", err));
	}
}

export class AbstractModel {
	private [abmCertificates]: Schemas.CertificatesSchema;
	private [abmModel]: Schemas.PartitionedBundle;
	private [abmOverrides]: Schemas.OverridesSupportedOptions;

	constructor(options: AbstractModelOptions) {
		this[abmModel] = options.bundle;
		this[abmCertificates] = options.certificates;
		this[abmOverrides] = options.overrides;
	}

	get certificates(): Schemas.CertificatesSchema {
		return this[abmCertificates];
	}

	get bundle(): Schemas.PartitionedBundle {
		return this[abmModel];
	}

	get overrides(): Schemas.OverridesSupportedOptions {
		return this[abmOverrides];
	}
}
