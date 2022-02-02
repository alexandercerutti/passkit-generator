import { PKPass } from "passkit-generator";

/** Assets are handled by Webpack url-loader */
import icon from "../../../models/exampleBooking.pass/icon.png";
import icon2x from "../../../models/exampleBooking.pass/icon@2x.png";
import footer from "../../../models/exampleBooking.pass/footer.png";
import footer2x from "../../../models/exampleBooking.pass/footer@2x.png";
import background2x from "../../../models/examplePass.pass/background@2x.png";

// ************************** //
// *** END ASSETS LOADING *** //
// ************************** //

declare global {
	/**
	 * "var" (instead of let and cost) is required here
	 * to make typescript mark that these global variables
	 * are available also in globalThis.
	 *
	 * These are secrets we have defined through `wrangler secret put <var name>`.
	 * @see https://developers.cloudflare.com/workers/platform/environment-variables
	 */

	/** Pass signerCert */
	var SIGNER_CERT: string;
	/** Pass signerKey */
	var SIGNER_KEY: string;
	var SIGNER_PASSPHRASE: string;
	var WWDR: string;
}

/**
 * Request entry point
 */

globalThis.addEventListener("fetch", async (event: FetchEvent) => {
	event.respondWith(generatePass(event.request));
});

async function generatePass(request: Request) {
	const pass = new PKPass(
		/**
		 * Buffer is polyfilled by Webpack. Files must be
		 * imported raw by webpack. See webpack.config.js
		 */
		{
			"icon.png": Buffer.from(icon),
			"icon@2x.png": Buffer.from(icon2x),
			"footer.png": Buffer.from(footer),
			"footer@2x.png": Buffer.from(footer2x),
			"background@2x.png": Buffer.from(background2x),
		},
		{
			signerCert: SIGNER_CERT,
			signerKey: SIGNER_KEY,
			signerKeyPassphrase: SIGNER_PASSPHRASE,
			wwdr: WWDR,
		},
		{
			description: "Example Pass generated through a cloudflare worker",
			serialNumber: "81592CQ7838",
			passTypeIdentifier: "pass.com.passkitgenerator",
			teamIdentifier: "F53WB8AE67",
			organizationName: "Apple Inc.",
			foregroundColor: "rgb(255, 255, 255)",
			backgroundColor: "rgb(60, 65, 76)",
		},
	);

	pass.setBarcodes("1276451828321");
	pass.type = "boardingPass";
	pass.transitType = "PKTransitTypeAir";

	pass.headerFields.push(
		{
			key: "header1",
			label: "Data",
			value: "25 mag",
			textAlignment: "PKTextAlignmentCenter",
		},
		{
			key: "header2",
			label: "Volo",
			value: "EZY997",
			textAlignment: "PKTextAlignmentCenter",
		},
	);

	pass.primaryFields.push(
		{
			key: "IATA-source",
			value: "NAP",
			label: "Napoli",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "IATA-destination",
			value: "VCE",
			label: "Venezia Marco Polo",
			textAlignment: "PKTextAlignmentRight",
		},
	);

	pass.secondaryFields.push(
		{
			key: "secondary1",
			label: "Imbarco chiuso",
			value: "18:40",
			textAlignment: "PKTextAlignmentCenter",
		},
		{
			key: "sec2",
			label: "Partenze",
			value: "19:10",
			textAlignment: "PKTextAlignmentCenter",
		},
		{
			key: "sec3",
			label: "SB",
			value: "Sì",
			textAlignment: "PKTextAlignmentCenter",
		},
		{
			key: "sec4",
			label: "Imbarco",
			value: "Anteriore",
			textAlignment: "PKTextAlignmentCenter",
		},
	);

	pass.auxiliaryFields.push(
		{
			key: "aux1",
			label: "Passeggero",
			value: "MR. WHO KNOWS",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "aux2",
			label: "Posto",
			value: "1A*",
			textAlignment: "PKTextAlignmentCenter",
		},
	);

	pass.backFields.push(
		{
			key: "document number",
			label: "Numero documento:",
			value: "- -",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "You're checked in, what next",
			label: "Hai effettuato il check-in, Quali sono le prospettive",
			value: "",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "Check In",
			label: "1. check-in✓",
			value: "",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "checkIn",
			label: "",
			value: "Le uscite d'imbarco chiudono 30 minuti prima della partenza, quindi sii puntuale. In questo aeroporto puoi utilizzare la corsia Fast Track ai varchi di sicurezza.",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "2. Bags",
			label: "2. Bagaglio",
			value: "",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "Require special assistance",
			label: "Assistenza speciale",
			value: "Se hai richiesto assistenza speciale, presentati a un membro del personale nell'area di Consegna bagagli almeno 90 minuti prima del volo.",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "3. Departures",
			label: "3. Partenze",
			value: "",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "photoId",
			label: "Un documento d’identità corredato di fotografia",
			value: "è obbligatorio su TUTTI i voli. Per un viaggio internazionale è necessario un passaporto valido o, dove consentita, una carta d’identità.",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "yourSeat",
			label: "Il tuo posto:",
			value: "verifica il tuo numero di posto nella parte superiore. Durante l’imbarco utilizza le scale anteriori e posteriori: per le file 1-10 imbarcati dalla parte anteriore; per le file 11-31 imbarcati dalla parte posteriore. Colloca le borse di dimensioni ridotte sotto il sedile davanti a te.",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "Pack safely",
			label: "Bagaglio sicuro",
			value: "Fai clic http://easyjet.com/it/articoli-pericolosi per maggiori informazioni sulle merci pericolose oppure visita il sito CAA http://www.caa.co.uk/default.aspx?catid=2200",
			textAlignment: "PKTextAlignmentLeft",
		},
		{
			key: "Thank you for travelling easyJet",
			label: "Grazie per aver viaggiato con easyJet",
			value: "",
			textAlignment: "PKTextAlignmentLeft",
		},
	);

	return new Response(pass.getAsBuffer(), {
		headers: { "content-type": pass.mimeType },
	});
}
