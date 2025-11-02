import { z } from "zod";

/**
 * @see https://developer.apple.com/documentation/walletpasses/pass/nfc
 */
export type NFC = z.infer<typeof NFC>;

export const NFC = z.object({
	message: z.string().check(z.maxLength(64)),
	encryptionPublicKey: z.string(),
	requiresAuthentication: z.boolean().optional(),
});
