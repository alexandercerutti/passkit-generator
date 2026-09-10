export { default as PKPass } from "./PKPass.js";
export { PassType } from "./PassType.js";

// ***************************************** //
// *** Exporting only schemas interfaces *** //
// ***************************************** //

export type {
	Barcode,
	Beacon,
	Field,
	Location,
	NFC,
	PassProps,
	Semantics,
	TransitType,
	Personalize,
	OverridablePassProps,
} from "./schemas/index.js";
