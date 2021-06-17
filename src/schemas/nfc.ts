import Joi from "joi";

export interface NFC {
	message: string;
	encryptionPublicKey?: string;
}

export const NFC = Joi.object<NFC>().keys({
	message: Joi.string().required().max(64),
	encryptionPublicKey: Joi.string(),
});
