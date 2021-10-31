import { ALBEvent, ALBResult } from "aws-lambda";
import { PKPass } from "passkit-generator";
import {
	createPassGenerator,
	getRandomColorPart,
	getSpecificFileInModel,
} from "../shared";

/**
 * Lambda for scratch example
 */

export async function scratch(event: ALBEvent) {
	const passGenerator = createPassGenerator(undefined, {
		description: "Example Apple Wallet Pass",
		passTypeIdentifier: "pass.com.passkitgenerator",
		serialNumber: "nmyuxofgna",
		organizationName: `Test Organization ${Math.random()}`,
		teamIdentifier: "F53WB8AE67",
		foregroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
		labelColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
		backgroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
	});

	const [{ value }, iconFromModel] = await Promise.all([
		passGenerator.next(),
		getSpecificFileInModel(
			"icon.png",
			event.queryStringParameters.modelName,
		),
	]);

	const pass = value as PKPass;

	pass.type = "boardingPass";
	pass.transitType = "PKTransitTypeAir";

	pass.headerFields.push(
		{
			key: "header-field-test-1",
			value: "Unknown",
		},
		{
			key: "header-field-test-2",
			value: "unknown",
		},
	);

	pass.primaryFields.push(
		{
			key: "primaryField-1",
			value: "NAP",
		},
		{
			key: "primaryField-2",
			value: "VCE",
		},
	);

	/**
	 * Required by Apple. If one is not available, a
	 * pass might be openable on a Mac but not on a
	 * specific iPhone model
	 */

	pass.addBuffer("icon.png", iconFromModel);
	pass.addBuffer("icon@2x.png", iconFromModel);
	pass.addBuffer("icon@3x.png", iconFromModel);

	return (await passGenerator.next(pass as PKPass)).value as ALBResult;
}
