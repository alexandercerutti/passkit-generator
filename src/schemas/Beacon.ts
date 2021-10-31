import Joi from "joi";

/**
 * @see https://developer.apple.com/documentation/walletpasses/pass/beacons
 */

export interface Beacon {
	major?: number;
	minor?: number;
	relevantText?: string;
	proximityUUID: string;
}

export const Beacon = Joi.object<Beacon>().keys({
	major: Joi.number()
		.integer()
		.positive()
		.max(65535)
		.greater(Joi.ref("minor")),
	minor: Joi.number().integer().min(0).max(65535),
	proximityUUID: Joi.string().required(),
	relevantText: Joi.string(),
});
