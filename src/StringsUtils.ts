import { EOL } from "os";

// ************************************ //
// *** UTILS FOR PASS.STRINGS FILES *** //
// ************************************ //

/**
 * Parses a string file to convert it to
 * an object
 *
 * @param buffer
 * @returns
 */

export function parse(buffer: Buffer) {
	const fileAsString = buffer.toString("utf8");
	const translationRowRegex = /"(?<key>.+)"\s+=\s+"(?<value>.+)";\n?/;
	const commentRowRegex = /\/\*\s*(.+)\s*\*\//;

	let translations: [placeholder: string, value: string][] = [];
	let comments: string[] = [];

	let blockStartPoint = 0;
	let blockEndPoint = 0;

	do {
		if (
			/** New Line, new life */
			/\n/.test(fileAsString[blockEndPoint]) ||
			/** EOF  */
			blockEndPoint === fileAsString.length
		) {
			let match: RegExpMatchArray | null;

			const section = fileAsString.substring(
				blockStartPoint,
				blockEndPoint + 1,
			);

			if ((match = section.match(translationRowRegex)) && match.groups) {
				const {
					groups: { key, value },
				} = match;

				translations.push([key, value]);
			} else if ((match = section.match(commentRowRegex))) {
				const [, content] = match;

				comments.push(content.trimEnd());
			}

			/** Skipping \n and going to the next block. */
			blockEndPoint += 2;
			blockStartPoint = blockEndPoint - 1;
		} else {
			blockEndPoint += 1;
		}
	} while (blockEndPoint <= fileAsString.length);

	return {
		translations,
		comments,
	};
}

/**
 * Creates a strings file buffer
 *
 * @param translations
 * @returns
 */

export function create(translations: { [key: string]: string }): Buffer {
	const stringContents = [];

	const translationsEntries = Object.entries(translations);

	for (let i = 0; i < translationsEntries.length; i++) {
		const [key, value] = translationsEntries[i];

		stringContents.push(`"${key}" = "${value}";`);
	}

	return Buffer.from(stringContents.join(EOL));
}
