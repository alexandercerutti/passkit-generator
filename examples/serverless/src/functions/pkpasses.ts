import { ALBEvent } from "aws-lambda";
import { PKPass } from "passkit-generator";
import {
	getCertificates,
	getSpecificFileInModel,
	getS3Instance,
	getRandomColorPart,
	finish400WithoutModelName,
} from "../shared";
import config from "../../config.json";

/**
 * Lambda for PkPasses example
 */

export async function pkpasses(event: ALBEvent) {
	finish400WithoutModelName(event);

	const [certificates, iconFromModel, s3] = await Promise.all([
		getCertificates(),
		getSpecificFileInModel(
			"icon.png",
			event.queryStringParameters.modelName,
		),
		getS3Instance(),
	]);

	function createPass() {
		const pass = new PKPass({}, certificates, {
			description: "Example Apple Wallet Pass",
			passTypeIdentifier: "pass.com.passkitgenerator",
			serialNumber: "nmyuxofgna",
			organizationName: `Test Organization ${Math.random()}`,
			teamIdentifier: "F53WB8AE67",
			foregroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
			labelColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
			backgroundColor: `rgb(${getRandomColorPart()}, ${getRandomColorPart()}, ${getRandomColorPart()})`,
		});

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

		return pass;
	}

	const passes = await Promise.all([
		Promise.resolve(createPass()),
		Promise.resolve(createPass()),
		Promise.resolve(createPass()),
		Promise.resolve(createPass()),
	]);

	const pkpasses = PKPass.pack(...passes);

	const buffer = pkpasses.getAsBuffer();
	const passName = `GeneratedPass-${Math.random()}.pkpass`;

	const { Location } = await s3
		.upload({
			Bucket: config.PASSES_S3_TEMP_BUCKET,
			Key: passName,
			ContentType: pkpasses.mimeType,
			/** Marking it as expiring in 5 minutes, because passes should not be stored */
			Expires: new Date(Date.now() + 5 * 60 * 1000),
			Body: buffer,
		})
		.promise();

	/**
	 * Please note that redirection to `Location` does not work
	 * if you open this code in another device if this is run
	 * offline. This because `Location` is on localhost. Didn't
	 * find yet a way to solve this.
	 */

	return {
		statusCode: 302,
		headers: {
			"Content-Type": "application/vnd.apple.pkpass",
			Location: Location,
		},
	};
}
