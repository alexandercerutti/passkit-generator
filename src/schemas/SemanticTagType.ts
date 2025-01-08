import Joi from "joi";
import { RGB_HEX_COLOR_REGEX } from "./regexps";

/**
 * These couple of structures are organized alphabetically,
 * according to the order on the developer documentation.
 *
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype
 */

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/currencyamount-data.dictionary
 */
export interface CurrencyAmount {
	currencyCode?: string; // ISO 4217 currency code
	amount?: string;
}

export const CurrencyAmount = Joi.object<CurrencyAmount>().keys({
	currencyCode: Joi.string(),
	amount: Joi.string(),
});

/**
 * For newly-introduced event tickets
 * in iOS 18.
 *
 * @see \<undiclosed>
 */

export interface EventDateInfo {
	date: string;
	ignoreTimeComponents?: boolean;
	timeZone?: string;
}

export const EventDateInfo = Joi.object<EventDateInfo>().keys({
	date: Joi.string().isoDate().required(),
	ignoreTimeComponents: Joi.boolean(),
	timeZone: Joi.string(),
});

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/location-data.dictionary
 */
export interface Location {
	latitude: number;
	longitude: number;
}

export const Location = Joi.object<Location>().keys({
	latitude: Joi.number().required(),
	longitude: Joi.number().required(),
});

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/personnamecomponents-data.dictionary
 */
export interface PersonNameComponents {
	familyName?: string;
	givenName?: string;
	middleName?: string;
	namePrefix?: string;
	nameSuffix?: string;
	nickname?: string;
	phoneticRepresentation?: string;
}

export const PersonNameComponents = Joi.object<PersonNameComponents>().keys({
	givenName: Joi.string(),
	familyName: Joi.string(),
	middleName: Joi.string(),
	namePrefix: Joi.string(),
	nameSuffix: Joi.string(),
	nickname: Joi.string(),
	phoneticRepresentation: Joi.string(),
});

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/seat-data.dictionary
 */
export interface Seat {
	seatSection?: string;
	seatRow?: string;
	seatNumber?: string;
	seatIdentifier?: string;
	seatType?: string;
	seatDescription?: string;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	seatAisle?: string;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	seatLevel?: string;

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	seatSectionColor?: string;
}

export const Seat = Joi.object<Seat>().keys({
	seatSection: Joi.string(),
	seatRow: Joi.string(),
	seatNumber: Joi.string(),
	seatIdentifier: Joi.string(),
	seatType: Joi.string(),
	seatDescription: Joi.string(),

	/**
	 * Newly-introduced in iOS 18
	 * Used in poster event tickets
	 */
	seatAisle: Joi.string(),

	/**
	 * Newly-introduced in iOS 18
	 * Used in poster event tickets
	 */
	seatLevel: Joi.string(),

	/**
	 * For newly-introduced event tickets
	 * in iOS 18
	 */
	seatSectionColor: Joi.string().regex(RGB_HEX_COLOR_REGEX),
});

/**
 * @see https://developer.apple.com/documentation/walletpasses/semantictagtype/wifinetwork-data.dictionary
 */
export interface WifiNetwork {
	password: string;
	ssid: string;
}

export const WifiNetwork = Joi.object<WifiNetwork>().keys({
	password: Joi.string().required(),
	ssid: Joi.string().required(),
});
