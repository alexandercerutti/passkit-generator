import Joi from "joi";

/**
 * @see https://developer.apple.com/documentation/walletpasses/pass/nfc
 */

export interface NFC {
	message: string;
	encryptionPublicKey: string;
	requiresAuthentication?: boolean;
}

export const NFC = Joi.object<NFC>().keys({
	message: Joi.string().required().max(64),
	encryptionPublicKey: Joi.string().required(),
	requiresAuthentication: Joi.boolean(),
});
