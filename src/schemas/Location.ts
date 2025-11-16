import { z } from "zod";

/**
 * @see https://developer.apple.com/documentation/walletpasses/pass/locations
 */

export type Location = z.infer<typeof Location>;

export const Location = z.object({
	latitude: z.number(),
	longitude: z.number(),
	altitude: z.number().optional(),
	relevantText: z.string().optional(),
});
