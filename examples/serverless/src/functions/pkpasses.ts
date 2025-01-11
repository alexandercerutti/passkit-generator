/**
 * PKPasses generation through PKPass.pack static method
 * example.
 * Here it is showed manual model reading and
 * creating through another PKPass because in the other
 * examples, creation through templates is already shown
 *
 * PLEASE NOTE THAT, AT TIME OF WRITING, THIS EXAMPLE WORKS
 * ONLY IF PASSES ARE DOWNLOADED FROM SAFARI, due to the
 * support of PKPasses archives. To test this, you might
 * need to open a tunnel through NGROK if you cannot access
 * to your local machine (in my personal case, developing
 * under WSL is a pretty big limitation sometimes).
 *
 * PLEASE ALSO NOTE that, AT TIME OF WRITING (iOS 15.0 - 15.2)
 * Pass Viewer suffers of a really curious bug: issuing several
 * passes within the same pkpasses archive, all with the same
 * serialNumber, will lead to have a broken view and to add
 * just one pass. You can see the screenshots below:
 *
 * https://imgur.com/bDTbcDg.jpg
 * https://imgur.com/Y4GpuHT.jpg
 * https://i.imgur.com/qbJMy1d.jpg
 *
 * - "Alberto, come to look at APPLE."
 * **Alberto looks**
 * - "MAMMA MIA!""
 *
 * A feedback to Apple have been sent for this.
 */

import { ALBEvent } from "aws-lambda";
import { PKPass } from "passkit-generator";
import {
	getCertificates,
	getSpecificFileInModel,
	getS3Instance,
	getRandomColorPart,
	throwClientErrorWithoutModelName,
} from "../shared.js";
import config from "../../config.json";

/**
 * Lambda for PkPasses example
 */

export async function pkpasses(event: ALBEvent) {
	try {
		throwClientErrorWithoutModelName(event);
	} catch (err) {
		return err;
	}

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
			// Be sure to issue different serialNumbers or you might incur into the bug explained above
			serialNumber: `nmyuxofgna${Math.random()}`,
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

	/**
	 * Although the other passes are served as files, in this example
	 * we are uploading on s3 (local) just see how it works.
	 */

	const buffer = pkpasses.getAsBuffer();
	const passName = `GeneratedPass-${Math.random()}.pkpasses`;

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
	 * if you open this code in another device if this is is running
	 * offline. This because `Location` is on localhost. Didn't
	 * find yet a way to solve this.
	 */

	return {
		statusCode: 302,
		headers: {
			"Content-Type": pkpasses.mimeType,
			Location,
		},
	};
}
