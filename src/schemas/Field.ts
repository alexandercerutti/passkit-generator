import Joi from "joi";
import { Semantics } from "./Semantics";

export type PKDataDetectorType =
	| "PKDataDetectorTypePhoneNumber"
	| "PKDataDetectorTypeLink"
	| "PKDataDetectorTypeAddress"
	| "PKDataDetectorTypeCalendarEvent";

export type PKTextAlignmentType =
	| "PKTextAlignmentLeft"
	| "PKTextAlignmentCenter"
	| "PKTextAlignmentRight"
	| "PKTextAlignmentNatural";

export type PKDateStyleType =
	| "PKDateStyleNone"
	| "PKDateStyleShort"
	| "PKDateStyleMedium"
	| "PKDateStyleLong"
	| "PKDateStyleFull";

export type PKNumberStyleType =
	| "PKNumberStyleDecimal"
	| "PKNumberStylePercent"
	| "PKNumberStyleScientific"
	| "PKNumberStyleSpellOut";

/**
 * @see https://developer.apple.com/documentation/walletpasses/passfieldcontent
 */

export interface Field {
	attributedValue?: string | number | Date;
	changeMessage?: string;
	dataDetectorTypes?: PKDataDetectorType[];
	label?: string;
	textAlignment?: PKTextAlignmentType;
	key: string;
	value: string | number | Date;
	semantics?: Semantics;
	dateStyle?: PKDateStyleType;
	ignoresTimeZone?: boolean;
	isRelative?: boolean;
	timeStyle?: PKDateStyleType;
	currencyCode?: string;
	numberStyle?: PKNumberStyleType;
}

export interface FieldWithRow extends Field {
	row?: 0 | 1;
}

export const Field = Joi.object<Field>().keys({
	attributedValue: Joi.alternatives(
		Joi.string().allow(""),
		Joi.number(),
		Joi.date().iso(),
	),
	changeMessage: Joi.string(),
	dataDetectorTypes: Joi.array().items(
		Joi.string().regex(
			/(PKDataDetectorTypePhoneNumber|PKDataDetectorTypeLink|PKDataDetectorTypeAddress|PKDataDetectorTypeCalendarEvent)/,
			"dataDetectorType",
		),
	),
	label: Joi.string().allow(""),
	textAlignment: Joi.string().regex(
		/(PKTextAlignmentLeft|PKTextAlignmentCenter|PKTextAlignmentRight|PKTextAlignmentNatural)/,
		"graphic-alignment",
	),
	key: Joi.string().required(),
	value: Joi.alternatives(
		Joi.string().allow(""),
		Joi.number(),
		Joi.date().iso(),
	).required(),
	semantics: Semantics,
	// date fields formatters, all optionals
	dateStyle: Joi.string().regex(
		/(PKDateStyleNone|PKDateStyleShort|PKDateStyleMedium|PKDateStyleLong|PKDateStyleFull)/,
		"date style",
	),
	ignoresTimeZone: Joi.boolean(),
	isRelative: Joi.boolean(),
	timeStyle: Joi.string().regex(
		/(PKDateStyleNone|PKDateStyleShort|PKDateStyleMedium|PKDateStyleLong|PKDateStyleFull)/,
		"date style",
	),
	// number fields formatters, all optionals
	currencyCode: Joi.string().when("value", {
		is: Joi.number(),
		otherwise: Joi.string().forbidden(),
	}),
	numberStyle: Joi.string()
		.regex(
			/(PKNumberStyleDecimal|PKNumberStylePercent|PKNumberStyleScientific|PKNumberStyleSpellOut)/,
		)
		.when("value", {
			is: Joi.number(),
			otherwise: Joi.string().forbidden(),
		}),
});

export const FieldWithRow = Field.concat(
	Joi.object<FieldWithRow>().keys({
		row: Joi.number().min(0).max(1),
	}),
);
