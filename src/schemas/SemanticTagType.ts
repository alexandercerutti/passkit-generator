import { z } from "zod";
import { RGB_HEX_COLOR_REGEX } from "./regexps.js";

/**
 * These couple of structures are organized alphabetically,
 * according to the order on the developer documentation.
 *
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype
 */

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/currencyamount-data.dictionary
 */
export type CurrencyAmount = z.infer<typeof CurrencyAmount>;

export const CurrencyAmount = z.object({
	/**
	 * ISO 4217 currency code
	 */
	currencyCode: z.string().optional(),
	amount: z.string().optional(),
});

/**
 * @iOSVersion 18
 * @passStyle eventTicket (new layout)
 *
 * @see \<undiclosed>
 */

export type EventDateInfo = z.infer<typeof EventDateInfo>;

export const EventDateInfo = z.object({
	date: z.iso.datetime().optional(),
	ignoreTimeComponents: z.boolean().optional(),
	timeZone: z.string().optional(),

	/**
	 * @iOSVersion 18.1
	 *
	 * Indicates that the time was not announced yet.
	 * Leads to showing "TBA" in the UI when `date` is set.
	 * Setting `ignoreTimeComponents` to true, has higher priority
	 * over this property.
	 *
	 * When both `date` and `semantics.eventStartDate` are unset,
	 * `Date: TBA` will be shown in the UI.
	 */
	unannounced: z.boolean().optional(),

	/**
	 * @iOSVersion 18.1
	 *
	 * Indicates that the time of the event has not been determined yet.
	 * Leads to showing "TBD" in the UI when `date` is set.
	 * Setting `ignoreTimeComponents` to true, has higher priority
	 * over this property.
	 *
	 * This property has higher priority over `unannounced`.
	 *
	 * When both `date` and `semantics.eventStartDate` are unset,
	 * `Date: TBD` will be shown in the UI.
	 */
	undetermined: z.boolean().optional(),
});

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/location-data.dictionary
 */
export type Location = z.infer<typeof Location>;

export const Location = z.object({
	latitude: z.number(),
	longitude: z.number(),
});

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/personnamecomponents-data.dictionary
 */
export type PersonNameComponents = z.infer<typeof PersonNameComponents>;

export const PersonNameComponents = z.object({
	givenName: z.string().optional(),
	familyName: z.string().optional(),
	middleName: z.string().optional(),
	namePrefix: z.string().optional(),
	nameSuffix: z.string().optional(),
	nickname: z.string().optional(),
	phoneticRepresentation: z.string().optional(),
});

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/seat-data.dictionary
 */
export type Seat = z.infer<typeof Seat>;

export const Seat = z.object({
	seatSection: z.string().optional(),
	seatRow: z.string().optional(),
	seatNumber: z.string().optional(),
	seatIdentifier: z.string().optional(),
	seatType: z.string().optional(),
	seatDescription: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	seatAisle: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	seatLevel: z.string().optional(),

	/**
	 * @iOSVersion 18
	 * @passStyle eventTicket (new layout)
	 */
	seatSectionColor: z.string().check(z.regex(RGB_HEX_COLOR_REGEX)).optional(),
});

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/wifinetwork-data.dictionary
 */
export type WifiNetwork = z.infer<typeof WifiNetwork>;

export const WifiNetwork = z.object({
	password: z.string(),
	ssid: z.string(),
});
