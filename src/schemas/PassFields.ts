import Joi from "joi";
import { Field } from "./Field";

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
	auxiliaryFields: (Field & { row?: number })[];
	backFields: Field[];
	headerFields: Field[];
	primaryFields: Field[];
	secondaryFields: Field[];
	transitType?: TransitType;
}

export const PassFields = Joi.object<PassFields>().keys({
	auxiliaryFields: Joi.array().items(
		Joi.object()
			.keys({
				row: Joi.number().max(1).min(0),
			})
			.concat(Field),
	),
	backFields: Joi.array().items(Field),
	headerFields: Joi.array().items(Field),
	primaryFields: Joi.array().items(Field),
	secondaryFields: Joi.array().items(Field),
	transitType: TransitType,
});
