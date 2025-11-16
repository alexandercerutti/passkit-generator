import { z } from "zod";

/**
 * @see https://developer.apple.com/documentation/walletpasses/pass/beacons
 */

export type Beacon = z.infer<typeof Beacon>;

export const Beacon = z.object({
	proximityUUID: z.string(),
	major: z.number().min(0).max(65535).optional(),
	minor: z.number().min(0).max(65535).optional(),
	relevantText: z.string().optional(),
});
