import Joi from "joi";

/**
 * @see https://developer.apple.com/documentation/walletpasses/pass/barcodes
 * Some barcodes are only available in iOS 27 and later.
 */

export type BarcodeFormat =
	| "PKBarcodeFormatQR"
	| "PKBarcodeFormatPDF417"
	| "PKBarcodeFormatAztec"
	| "PKBarcodeFormatCode128"

	/**
	 * @iOSVersion 27
	 */
	| "PKBarcodeFormatCode39"
	| "PKBarcodeFormatCodabar"
	| "PKBarcodeFormatEAN13"
	| "PKBarcodeFormatI2of5";

export interface Barcode {
	format: BarcodeFormat;
	message: string;
	altText?: string;
	messageEncoding?: string;
}

export const Barcode = Joi.object<Barcode>().keys({
	format: Joi.string()
		.required()
		.regex(
			/(PKBarcodeFormatQR|PKBarcodeFormatPDF417|PKBarcodeFormatAztec|PKBarcodeFormatCode128|PKBarcodeFormatCode39|PKBarcodeFormatCodabar|PKBarcodeFormatEAN13|PKBarcodeFormatI2of5)/,
			"barcodeType",
		),
	message: Joi.string().required(),
	altText: Joi.string(),
	messageEncoding: Joi.string().default("iso-8859-1"),
});
