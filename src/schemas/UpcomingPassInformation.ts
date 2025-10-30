import Joi from "joi";
import { PassFieldContent } from "./PassFieldContent.js";
import { Semantics } from "./Semantics.js";
import { URL_REGEX } from "./regexps.js";

/**
 * @iOSVersion 26
 * @see https://developer.apple.com/documentation/walletpasses/upcomingpassinformationentrytype/imageurlentry-data.dictionary
 */
interface ImageURLEntry {
	/** The SHA256 hash of the image. */
	SHA256: string;

	/** The URL that points to the image asset to be downloaded. This must be an https link. */
	URL: string;

	/** The scale of the image. If unspecified, defaults to 1. */
	scale?: number;

	/** Size of the image asset in bytes. The maximum allowed size is 2 megabytes. */
	size?: number;
}

const ImageURLEntry = Joi.object<ImageURLEntry>({
	SHA256: Joi.string().required(),
	URL: Joi.string().regex(URL_REGEX).required(),
	scale: Joi.number().default(1),
	size: Joi.number().max(2 * 1024 * 1024), // 2 megabytes max
});

/**
 * @iOSVersion 26
 * @see https://developer.apple.com/documentation/walletpasses/upcomingpassinformationentrytype/image-data.dictionary
 */
interface Image {
	/** A list of URLs used to retrieve an image. The upcoming pass information entry uses the item that best matches the device's scale. */
	URLs?: ImageURLEntry[];

	/** Indicates whether to use the local equivalent image instead of the image specified by URLs. */
	reuseExisting?: boolean;
}

const Image = Joi.object<Image>({
	URLs: Joi.array().items(ImageURLEntry),
	reuseExisting: Joi.boolean(),
});

/**
 * @iOSVersion 26
 * @see https://developer.apple.com/documentation/walletpasses/upcomingpassinformationentry/images-data.dictionary
 */
interface Images {
	/** The name of the image file used for the header image on the details screen. This can be a remote asset. */
	headerImage?: Image;

	/** The name of the image file used for the venue map in the event guide for each upcoming pass information entry. This can be a remote asset and is available for event entries. */
	venueMap?: Image;
}

const Images = Joi.object<Images>({
	headerImage: Image,
	venueMap: Image,
});

/**
 * @iOSVersion 26
 * @see https://developer.apple.com/documentation/walletpasses/upcomingpassinformationentry/urls-data.dictionary
 */
interface URLs {
	/** A URL that links to your or the venue's accessibility content. */
	accessibilityURL?: string;

	/** A URL that links to experiences that you can add on to your ticket or that allows you to access your existing prepurchased or preloaded add-on experiences, including any necessary QR or barcode links to access the experience. For example, loaded value or upgrades for an experience. */
	addOnURL?: string;

	/** A URL that links out to the bag policy of the venue. */
	bagPolicyURL?: string;

	/** The preferred email address to contact the venue, event, or issuer. */
	contactVenueEmail?: string;

	/** The preferred phone number to contact the venue, event, or issuer. */
	contactVenuePhoneNumber?: string;

	/** A URL that links the user to the website of the venue, event, or issuer. */
	contactVenueWebsite?: string;

	/** A URL that links to content you have about getting to the venue. */
	directionsInformationURL?: string;

	/** A URL that links to order merchandise for the specific event. This can be a ship-to-home ecommerce site, a pre-order to pickup at the venue, or other appropriate merchandise flow. This link can also be updated throughout the user's journey to provide more accurately tailored links at certain times. For example, before versus after a user enters an event. This can be done through a pass update. For more information on updating a pass, see Distributing and updating a pass. */
	merchandiseURL?: string;

	/** A URL that links out to the food-ordering page for the venue. This can be in-seat food delivery, pre-order for pickup at a vendor, or other appropriate food-ordering service. */
	orderFoodURL?: string;

	/** A URL that links to any information you have about parking. */
	parkingInformationURL?: string;

	/** A URL that links to your experience to buy or access prepaid parking or general parking information. */
	purchaseParkingURL?: string;

	/** A URL that launches the user into the issuer's flow for selling their current ticket. Provide as deep a link as possible into the sale flow. */
	sellURL?: string;

	/** A URL that launches the user into the issuer's flow for transferring the current ticket. Provide as deep a link as possible into the transfer flow. */
	transferURL?: string;

	/** A URL that links to documentation you have about public or private transit to the venue. */
	transitInformationURL?: string;
}

const URLs = Joi.object<URLs>({
	accessibilityURL: Joi.string().regex(URL_REGEX),
	addOnURL: Joi.string().regex(URL_REGEX),
	bagPolicyURL: Joi.string().regex(URL_REGEX),
	/**
	 * Joi's email schema validates email TLDs and only allows TLDs that are registered in the IANA Registry.
	 * This also requires NodeJS runtime to work (even though can be enabled client side, but discouraged)
	 * Reference - https://github.com/hapijs/joi/issues/2390
	 */
	contactVenueEmail: Joi.string().email({ tlds: false }),
	contactVenuePhoneNumber: Joi.string(),
	contactVenueWebsite: Joi.string().regex(URL_REGEX),
	directionsInformationURL: Joi.string().regex(URL_REGEX),
	merchandiseURL: Joi.string().regex(URL_REGEX),
	orderFoodURL: Joi.string().regex(URL_REGEX),
	parkingInformationURL: Joi.string().regex(URL_REGEX),
	purchaseParkingURL: Joi.string().regex(URL_REGEX),
	sellURL: Joi.string().regex(URL_REGEX),
	transferURL: Joi.string().regex(URL_REGEX),
	transitInformationURL: Joi.string().regex(URL_REGEX),
});

/**
 * @iOSVersion 26
 * @see https://developer.apple.com/documentation/walletpasses/upcomingpassinformationentry/dateinformation-data.dictionary
 */
interface DateInformation {
	/**
	 * A string containing an ISO 8601 date and time.
	 * The date and time when the event is scheduled.
	 */
	date?: string | Date;

	/**
	 * A Boolean value that controls whether the time appears on the pass.
	 * When true, the pass displays only the date, not the time.
	 */
	ignoreTimeComponents?: boolean;

	/**
	 * A Boolean value that indicates whether the event lasts all day.
	 * When true, the system ignores the time portion of the date.
	 */
	isAllDay?: boolean;

	/**
	 * A Boolean value that indicates whether the event time is unannounced.
	 * When true, the pass displays "Time TBA" instead of the actual time.
	 */
	isUnannounced?: boolean;

	/**
	 * A Boolean value that indicates whether the event time is undetermined.
	 * When true, the pass may display the date differently to indicate uncertainty.
	 */
	isUndetermined?: boolean;

	/**
	 * The time zone for the event.
	 * Use IANA time zone database names (e.g., "America/New_York").
	 */
	timeZone?: string;
}

const DateInformation = Joi.object<DateInformation>({
	date: Joi.alternatives(Joi.string().isoDate(), Joi.date().iso()).required(),
	ignoreTimeComponents: Joi.boolean(),
	isAllDay: Joi.boolean(),
	isUnannounced: Joi.boolean(),
	isUndetermined: Joi.boolean(),
	timeZone: Joi.string(),
});

/**
 * @iOSVersion 26
 * @see https://developer.apple.com/documentation/walletpasses/upcomingpassinformationentry
 */
export interface UpcomingPassInformationEntry {
	/** A collection of URLs used to populate UI elements in the details view. */
	URLs?: URLs;

	/** The fields of information displayed on the Additional Info section below a pass. */
	additionalInfoFields?: PassFieldContent[];

	/**
	 * An array of App Store identifiers for apps associated with the upcoming pass information entry.
	 * The associated app on a device is the first item in the array that's compatible with that device.
	 * This key works only for upcoming pass information entries for an event. A link to launch the app
	 * is in the event guide of the entry details view. If the app isn't installed, the link opens to the App Store.
	 */
	auxiliaryStoreIdentifiers?: number[];

	/** The fields of information displayed on the details view of the upcoming pass information entry. */
	backFields?: PassFieldContent[];

	/**
	 * Information about the start and end time of the upcoming pass information entry.
	 * If omitted, the entry is labeled as TBD.
	 */
	dateInformation?: DateInformation;

	/**
	 * A string that uniquely identifies the upcoming pass information entry.
	 * The identifier needs to be unique for each upcoming information entry.
	 */
	identifier: string;

	/** A collection of image names used to populate images in the details view. */
	images?: Images;

	/**
	 * Indicates whether the upcoming pass information entry is currently active.
	 * The default value is false.
	 */
	isActive?: boolean;

	/** The name of the upcoming pass information entry. */
	name: string;

	/** The semantic, machine-readable metadata about the upcoming pass information entry. */
	semantics?: Semantics & {
		venuePlaceID: string;
	};

	/**
	 * The type of upcoming pass information entry.
	 * Value: event
	 */
	type: "event";
}

export const UpcomingPassInformationEntry =
	Joi.object<UpcomingPassInformationEntry>({
		URLs: URLs,
		additionalInfoFields: Joi.array().items(PassFieldContent),
		auxiliaryStoreIdentifiers: Joi.array().items(Joi.number()),
		backFields: Joi.array().items(PassFieldContent),
		dateInformation: DateInformation,
		identifier: Joi.string().required(),
		images: Images,
		isActive: Joi.boolean(),
		name: Joi.string().required(),
		semantics: Semantics.concat(
			Joi.object({
				venuePlaceID: Joi.string(),
			}),
		),
		type: Joi.string().valid("event").required(),
	});
