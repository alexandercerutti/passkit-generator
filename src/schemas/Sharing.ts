import Joi from "joi";
import { URL_REGEX } from "./regexps.js";

/**
 * Undocumented feature (not in Apple's Wallet Passes documentation).
 *
 * Verified on iOS 27.2 (iPhone, October 2026).
 *
 * With `formatVersion: 2` (undocumented as well), Wallet refuses any pass whose type identifier does not
 * start with `pass.com.apple.` and that contains `sharing` ("Pass is not permitted to contain the sharing key.").
 */

export type SharingMethod =
	/**
	 * the pass file is shared (default behavior)
	 */
	| "PKPassSharingMethodPass"
	/**
	 *  The share button shares `url` (and `text`) instead of
	 *  the pass file. Some applications may **NOT** receive the `text` field.
	 *  but only the `url`.
	 */
	| "PKPassSharingMethodURL"
	/**
	 * The Share button is removed (same as `sharingProhibited: true`)
	 */
	| "PKPassSharingMethodDisabled";

export interface Sharing {
	method: SharingMethod;

	/**
	 * Read by Wallet only when `method` is `PKPassSharingMethodURL`,
	 * where it is required.
	 */
	url?: string;

	/**
	 * Shared before `url` by Apple's own share targets.
	 * Third-party apps usually drop it.
	 */
	text?: string;
}

export const Sharing = Joi.object<Sharing>().keys({
	method: Joi.string()
		.valid(
			"PKPassSharingMethodDisabled",
			"PKPassSharingMethodPass",
			"PKPassSharingMethodURL",
		)
		.required(),
	url: Joi.string().regex(URL_REGEX).when("method", {
		is: "PKPassSharingMethodURL",
		then: Joi.required(),
	}),
	text: Joi.string(),
});
