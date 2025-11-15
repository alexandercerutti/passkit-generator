import z from "zod";

export const httpAddressSchema = z.url({
	protocol: /^https?$/,
});

export const dateTimeSchema = z.union([
	z.iso.datetime({
		offset: true,
		local: true,
	}),
	z.date(),
]);

export const colorRgbHexSchema = z
	.string()
	.check(
		z.regex(
			/(?:\#[a-fA-F0-9]{3,6}|rgb\(\s*(?:[01]?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\s*,\s*(?:[01]?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\s*,\s*(?:[01]?[0-9][0-9]?|2[0-4][0-9]|25[0-5])\s*\))/,
		),
	);
