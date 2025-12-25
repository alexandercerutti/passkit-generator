import { z } from "zod";
import {
	PassFieldContent,
	PassFieldContentWithRow,
} from "./PassFieldContent.js";

export type TransitType = z.infer<typeof TransitType>;

export const TransitType = z.literal([
	"PKTransitTypeAir",
	"PKTransitTypeBoat",
	"PKTransitTypeBus",
	"PKTransitTypeGeneric",
	"PKTransitTypeTrain",
]);

export type PassFields = z.infer<typeof PassFields>;

export const PassFields = z
	.object({
		auxiliaryFields: z.array(PassFieldContentWithRow.or(PassFieldContent)),
		backFields: z.array(PassFieldContent),
		headerFields: z.array(PassFieldContent),
		primaryFields: z.array(PassFieldContent),
		secondaryFields: z.array(PassFieldContent),
		transitType: TransitType,

		/**
		 * @iOSVersion 18
		 * @passStyle eventTicket (new layout)
		 * @passDomain dashboard
		 *
		 * @see \<undiclosed>
		 */
		additionalInfoFields: z.array(PassFieldContent),
	})
	.partial();
