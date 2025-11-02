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

export const PassFields = z.object({
	auxiliaryFields: z.array(PassFieldContentWithRow).optional(),
	backFields: z.array(PassFieldContent).optional(),
	headerFields: z.array(PassFieldContent).optional(),
	primaryFields: z.array(PassFieldContent).optional(),
	secondaryFields: z.array(PassFieldContent).optional(),
	transitType: TransitType.optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain dashboard
	 *
	 * @see \<undiclosed>
	 */
	additionalInfoFields: z.array(PassFieldContent).optional(),
});
