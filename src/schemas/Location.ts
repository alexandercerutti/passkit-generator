import Joi from "joi";

/**
 * @see https://developer.apple.com/documentation/walletpasses/pass/locations
 */

export interface Location {
	relevantText?: string;
	altitude?: number;
	latitude: number;
	longitude: number;

	/**
	 * Undocumented in this position (Apple documents it at root level,
	 * where Wallet ignores it): maximum distance, in meters, from this
	 * location at which the pass is relevant.
	 *
	 * Wallet narrows location relevancy by using the smaller between this value and the default distance of
	 * the pass style, which is:
	 *
	 * - 100 m for coupon, storeCard, generic, posterGeneric;
	 * - 1500 m for eventTicket and boardingPass
	 *
	 * The position accuracy (up to 100 m) is added to it.
	 * Must be greater than 0: Wallet refuses the whole pass otherwise.
	 *
	 * @since iOS 7.0
	 */
	maxDistance?: number;
}

export const Location = Joi.object<Location>().keys({
	altitude: Joi.number(),
	latitude: Joi.number().required(),
	longitude: Joi.number().required(),
	relevantText: Joi.string(),
	maxDistance: Joi.number().positive(),
});
