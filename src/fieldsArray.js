const schema = require("./schema");
const debug = require("debug")("passkit:fields");

/**
 * Class to represent lower-level keys pass fields
 * @see https://apple.co/2wkUBdh
 */

const uniqueKeys = new Set();

class FieldsArray extends Array {
	constructor(...items) {
		super(...items);
	}

	/**
	 * Like `Array.prototype.push` but will alter
	 * also uniqueKeys set.
	 */

	push(...fieldsData) {
		let validFields = fieldsData.reduce((acc, current) => {
			if (!(typeof current === "object") || !schema.isValid(current, "field")) {
				return acc;
			}

			if (acc.some(e => e.key === current.key) || uniqueKeys.has(current.key)) {
				debug(`UNIQUE field key CONSTRAINT VIOLATED. Fields keys must be unique in pass scope. Field key: "${current.key}"`);
			} else {
				uniqueKeys.add(current.key);
				acc.push(current);
			}

			return acc;
		}, []);

		return Array.prototype.push.call(this, ...validFields);
	}

	/**
	 * Like `Array.prototype.pop`, but will alter
	 * also uniqueKeys set
	 */

	pop() {
		const element = Array.prototype.pop.call(this);
		uniqueKeys.delete(element.key);
		return element;
	}

	/**
	 * Like `Array.prototype.splice` but will alter
	 * also uniqueKeys set
	 */

	splice(start, deleteCount, ...items) {
		let removeList = this.slice(start, deleteCount+start);
		removeList.forEach(item => uniqueKeys.delete(item.key));

		return Array.prototype.splice.call(this, start, deleteCount, items);
	}

	get length() {
		return this.length;
	}

	static emptyUnique() {
		uniqueKeys.clear();
	}
}

module.exports = FieldsArray;
