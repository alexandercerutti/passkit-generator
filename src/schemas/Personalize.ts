import { z } from "zod";

/**
 * @see https://developer.apple.com/documentation/walletpasses/personalize
 */

type RequiredPersonalizationFields = z.infer<
	typeof RequiredPersonalizationFields
>;

const RequiredPersonalizationFields = z.literal([
	"PKPassPersonalizationFieldName",
	"PKPassPersonalizationFieldPostalCode",
	"PKPassPersonalizationFieldEmailAddress",
	"PKPassPersonalizationFieldPhoneNumber",
]);

export type Personalize = z.infer<typeof Personalize>;

export const Personalize = z.object({
	description: z.string(),
	requiredPersonalizationFields: z.array(RequiredPersonalizationFields),
	termsAndConditions: z.string().optional(),
});
