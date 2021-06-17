import Joi from "joi";

export interface Personalization {
	description: string;
	requiredPersonalizationFields: RequiredPersonalizationFields[];
	termsAndConditions?: string;
}

type RequiredPersonalizationFields =
	| "PKPassPersonalizationFieldName"
	| "PKPassPersonalizationFieldPostalCode"
	| "PKPassPersonalizationFieldEmailAddress"
	| "PKPassPersonalizationFieldPhoneNumber";

export const Personalization = Joi.object<Personalization>().keys({
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
