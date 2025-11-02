import { z } from "zod";

/**
 * @see https://developer.apple.com/documentation/walletpasses/pass/barcodes
 */

export type BarcodeFormat = z.infer<typeof BarcodeFormat>;

export const BarcodeFormat = z.literal([
	"PKBarcodeFormatQR",
	"PKBarcodeFormatPDF417",
	"PKBarcodeFormatAztec",
	"PKBarcodeFormatCode128",
]);

export type Barcode = z.infer<typeof Barcode>;

export const Barcode = z.object({
	format: BarcodeFormat,
	message: z.string(),
	altText: z.string().optional(),
	messageEncoding: z.string().default("iso-8859-1").optional(),
});
