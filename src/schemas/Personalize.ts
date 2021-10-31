import Joi from "joi";

/**
 * @see https://developer.apple.com/documentation/walletpasses/personalize
 */

type RequiredPersonalizationFields =
	| "PKPassPersonalizationFieldName"
	| "PKPassPersonalizationFieldPostalCode"
	| "PKPassPersonalizationFieldEmailAddress"
	| "PKPassPersonalizationFieldPhoneNumber";

export interface Personalize {
	description: string;
	requiredPersonalizationFields: RequiredPersonalizationFields[];
	termsAndConditions?: string;
}

export const Personalize = Joi.object<Personalize>().keys({
	description: Joi.string().required(),
	requiredPersonalizationFields: Joi.array()
		.items(
			"PKPassPersonalizationFieldName",
			"PKPassPersonalizationFieldPostalCode",
			"PKPassPersonalizationFieldEmailAddress",
			"PKPassPersonalizationFieldPhoneNumber",
		)
		.required(),
	termsAndConditions: Joi.string(),
});
