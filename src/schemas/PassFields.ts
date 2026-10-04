import Joi from "joi";
import {
	PassFieldContent,
	PassFieldContentWithRow,
} from "./PassFieldContent.js";

export type TransitType =
	| "PKTransitTypeAir"
	| "PKTransitTypeBoat"
	| "PKTransitTypeBus"
	| "PKTransitTypeGeneric"
	| "PKTransitTypeTrain";

export const TransitType = Joi.string().regex(
	/(PKTransitTypeAir|PKTransitTypeBoat|PKTransitTypeBus|PKTransitTypeGeneric|PKTransitTypeTrain)/,
);

export interface PassFields {
	auxiliaryFields: PassFieldContentWithRow[];
	backFields: PassFieldContent[];
	headerFields: PassFieldContent[];
	primaryFields: PassFieldContent[];
	secondaryFields: PassFieldContent[];
	transitType?: TransitType;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (posterEventTicket)
	 * @passDomain dashboard
	 *
	 * @iOSVersion 27
	 * @passStyle every style, classic included, but semanticBoardingPass
	 * @passDomain dashboard
	 *
	 * Note that links inside `attributedValue` are not rendered here.
	 *
	 * @see \<undiclosed>
	 */
	additionalInfoFields?: PassFieldContent[];

	/**
	 * @iOSVersion 27
	 * @passStyle posterGeneric
	 */
	footerFields?: PassFieldContent[];
}

export const PassFields = Joi.object<PassFields>().keys({
	auxiliaryFields: Joi.array().items(PassFieldContentWithRow),
	backFields: Joi.array().items(PassFieldContent),
	headerFields: Joi.array().items(PassFieldContent),
	primaryFields: Joi.array().items(PassFieldContent),
	secondaryFields: Joi.array().items(PassFieldContent),
	transitType: TransitType,

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain dashboard
	 *
	 * @see \<undiclosed>
	 */
	additionalInfoFields: Joi.array().items(PassFieldContent),

	/**
	 * @iOSVersion 27
	 * @passStyle posterGeneric (new layout)
	 */
	footerFields: Joi.array().items(PassFieldContent),
});
