import { ALBEvent, ALBResult } from "aws-lambda";
import { PKPass } from "passkit-generator";
import { createPassGenerator } from "../shared.js";

/**
 * Lambda for fields example
 */

export async function fields(event: ALBEvent) {
	const { modelName, ...passOptions } = event.queryStringParameters;

	const passGenerator = createPassGenerator("exampleBooking", passOptions);

	const pass = (await passGenerator.next()).value as PKPass;

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

	return (await passGenerator.next(pass as PKPass)).value as ALBResult;
}
