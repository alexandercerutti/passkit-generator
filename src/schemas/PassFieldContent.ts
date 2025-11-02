import { z } from "zod";
import { Semantics } from "./Semantics.js";

export type PKDataDetectorType = z.infer<typeof PKDataDetectorType>;

const PKDataDetectorType = z.literal([
	"PKDataDetectorTypePhoneNumber",
	"PKDataDetectorTypeLink",
	"PKDataDetectorTypeAddress",
	"PKDataDetectorTypeCalendarEvent",
]);

export type PKTextAlignmentType = z.infer<typeof PKTextAlignmentType>;

const PKTextAlignmentType = z.literal([
	"PKTextAlignmentLeft",
	"PKTextAlignmentCenter",
	"PKTextAlignmentRight",
	"PKTextAlignmentNatural",
]);

export type PKDateStyleType = z.infer<typeof PKDateStyleType>;

const PKDateStyleType = z.literal([
	"PKDateStyleNone",
	"PKDateStyleShort",
	"PKDateStyleMedium",
	"PKDateStyleLong",
	"PKDateStyleFull",
]);

export type PKNumberStyleType = z.infer<typeof PKNumberStyleType>;

const PKNumberStyleType = z.literal([
	"PKNumberStyleDecimal",
	"PKNumberStylePercent",
	"PKNumberStyleScientific",
	"PKNumberStyleSpellOut",
]);

/**
 * @see https://developer.apple.com/documentation/walletpasses/passfieldcontent
 */

export type PassFieldContent = z.infer<typeof PassFieldContent>;

const PassFieldContentShared = z.object({
	attributedValue: z.union([z.string(), z.number(), z.iso.date()]).optional(),

	changeMessage: z.string().optional(),

	dataDetectorTypes: z.array(PKDataDetectorType).optional(),

	label: z.string().optional(),

	textAlignment: PKTextAlignmentType.optional(),

	key: z.string(),

	semantics: Semantics.optional(),

	// date fields formatters, all optionals
	dateStyle: PKDateStyleType.optional(),

	ignoresTimeZone: z.boolean().optional(),

	isRelative: z.boolean().optional(),

	timeStyle: PKDateStyleType.optional(),
});

export const PassFieldContent = z.discriminatedUnion("value", [
	PassFieldContentShared.extend({
		value: z.union([z.string(), z.iso.date()]),
	}),
	PassFieldContentShared.extend({
		value: z.number(),
		currencyCode: z.string().optional(),
		numberStyle: PKNumberStyleType.optional(),
	}),
]);

export type PassFieldContentWithRow = z.infer<typeof PassFieldContentWithRow>;

export const PassFieldContentWithRow = PassFieldContent.and(
	z.object({
		row: z.literal([0, 1]),
	}),
);

/**
 * @deprecated Use `PassFieldContentWithRow` instead,
 * which is the right Apple name.
 */
export type FieldWithRow = PassFieldContentWithRow;

/**
 * @deprecated Use `PassFieldContentWithRow` instead,
 * which is the right Apple name.
 */
export const FieldWithRow = PassFieldContentWithRow;

/**
 * @deprecated Use `PassFieldContent` instead,
 * which is the right Apple name.
 */
export type Field = PassFieldContent;

/**
 * @deprecated Use `PassFieldContent` instead,
 * which is the right Apple name.
 */
export const Field = PassFieldContent;
