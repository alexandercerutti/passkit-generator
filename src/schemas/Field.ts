import Joi from "joi";
import { Semantics } from "./Semantics";

/**
 * @see https://developer.apple.com/documentation/walletpasses/passfieldcontent
 */

export interface Field {
	attributedValue?: string | number | Date;
	changeMessage?: string;
	dataDetectorTypes?: string[];
	label?: string;
	textAlignment?: string;
	key: string;
	value: string | number | Date;
	semantics?: Semantics;
	dateStyle?: string;
	ignoresTimeZone?: boolean;
	isRelative?: boolean;
	timeStyle?: string;
	currencyCode?: string;
	numberStyle?: string;
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
	),
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
}).or("value", "attributedValue");
