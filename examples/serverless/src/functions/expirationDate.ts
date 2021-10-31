import { ALBEvent, ALBResult } from "aws-lambda";
import { Context } from "vm";
import { PKPass } from "passkit-generator";
import { finish400WithoutModelName, createPassGenerator } from "../shared";

/**
 * Lambda for expirationDate example
 */

export async function expirationDate(event: ALBEvent, context: Context) {
	finish400WithoutModelName(event);

	const { modelName, ...passOptions } = event.queryStringParameters;

	const passGenerator = createPassGenerator(modelName, passOptions);

	const pass = (await passGenerator.next()).value as PKPass;

	// 2 minutes later...
	const d = new Date();
	d.setMinutes(d.getMinutes() + 2);

	// setting the expiration
	(pass as PKPass).setExpirationDate(d);
	console.log(
		"EXPIRATION DATE EXPECTED:",
		(pass as PKPass).props["expirationDate"],
	);

	return (await passGenerator.next(pass as PKPass)).value as ALBResult;
}
