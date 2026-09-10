import Joi from "joi";

/**
 * Action types that can be used in the `featuredActions` property of a pass.
 *
 * @iOSVersion 27
 * @see https://developer.apple.com/documentation/walletpasses/defining-the-metadata-of-your-wallet-pass#Add-featured-actions
 */

export type FeaturedActionType =
	/**
	 * Opens link to view event schedule
	 */
	| "viewSchedule"
	/**
	 * Opens link to watch a trailer for an upcoming event
	 */
	| "watchTrailer"
	/**
	 * Opens link to playlist to listen to musical artist(s)
	 */
	| "listenToMusic"
	/**
	 * Opens phone app to call support
	 */
	| "call"
	/**
	 * Opens Maps to a singular location
	 */
	| "place"
	/**
	 * Opens link to load balance
	 */
	| "addToBalance"
	/**
	 * Opens link to facilitate pickup or delivery service
	 */
	| "order"
	/**
	 * Opens a link either online or in-app to an e-commerce store
	 */
	| "shop"
	/**
	 * Opens link to view membership benefits, points, and tiers for a membership program, either in your app or on your company’s website
	 */
	| "membershipBenefits"
	/**
	 * Opens the schedule to reserve a time slot for a service
	 */
	| "bookAppointment"
	/**
	 * Quickly leads someone to your app or website to book a car with a car rental service
	 */
	| "bookCar"
	/**
	 * Quickly leads someone your app or website to book a flight with airline service
	 */
	| "bookFlight"
	/**
	 * Leads people to your app or website to book a hotel or hospitality-related stay
	 */
	| "bookStay"
	/**
	 * Leads people to your app or website to take an action related to their membership offers or rewards
	 */
	| "viewOffersRewards";

/**
 * @iOSVersion 27
 *
 * Up to two Featured Action can be specified per pass in order to provide quick access to relevant actions.
 * This applies to all the pass types but posterEventTicket and semanticBoardingPass.
 */
export interface FeaturedAction {
	identifier: string;
	type: FeaturedActionType;
	url: string;
}

/**
 * @iOSVersion 27
 */
export const FeaturedAction = Joi.object<FeaturedAction>().keys({
	identifier: Joi.string().required(),
	type: Joi.string()
		.regex(
			/(viewSchedule|watchTrailer|listenToMusic|call|place|addToBalance|order|shop|membershipBenefits|bookAppointment|bookCar|bookFlight|bookStay|viewOffersRewards)/,
			"featuredActionType",
		)
		.required(),
	url: Joi.string().uri().required(),
});
