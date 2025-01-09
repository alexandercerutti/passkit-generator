import Joi from "joi";
import { Field, FieldWithRow } from "./Field";

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
	auxiliaryFields: FieldWithRow[];
	backFields: Field[];
	headerFields: Field[];
	primaryFields: Field[];
	secondaryFields: Field[];
	transitType?: TransitType;

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain dashboard
	 *
	 * @see \<undiclosed>
	 */
	additionalInfoFields?: Field[];
}

export const PassFields = Joi.object<PassFields>().keys({
	auxiliaryFields: Joi.array().items(FieldWithRow),
	backFields: Joi.array().items(Field),
	headerFields: Joi.array().items(Field),
	primaryFields: Joi.array().items(Field),
	secondaryFields: Joi.array().items(Field),
	transitType: TransitType,

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 * @passDomain dashboard
	 *
	 * @see \<undiclosed>
	 */
	additionalInfoFields: Joi.array().items(Field),
});
