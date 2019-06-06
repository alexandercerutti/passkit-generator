const schema = require("./schema");
const debug = require("debug")("passkit:fields");

/**
 * Pass fields must be unique (for key) in its scope.
 * Therefore we use a Set to keep them tracked.
 */

/**
 * Class to represent lower-level keys pass fields
 * @see https://apple.co/2wkUBdh
 */

class FieldsArray extends Object {
	constructor(fields) {
		super();

		/**
		 * Pass fields must be unique (for key) in its scope.
		 * Therefore we use a Set to keep them tracked.
		*/

		this.fieldsKeys = new Set();
		fields.forEach(a => this[a] = new ItemsArray(this));
	}

	addFieldKey(key) {
		if (this.fieldsKeys.has(key)) {
			debug(`Field with key "${key}" discarded: fields must be unique in pass scope.`);
		} else {
			this.fieldsKeys.add(key);
		}
	}

	deleteFieldKey(key) {
		this.fieldsKeys.delete(key);
	}

	emptyUnique() {
		this.fieldsKeys.clear();
	}
}

class ItemsArray extends Array {
	constructor(owner) {
		super();
	}

	/**
	 * Like `Array.prototype.push` but will alter
	 * also uniqueKeys set.
	 */

	push(...fieldsData) {
		const validFields = fieldsData.reduce((acc, current) => {
			if (!(typeof current === "object") || !schema.isValid(current, "field")) {
				return acc;
			}

			if (acc.some(e => e.key === current.key) || fieldsKeys.has(current.key)) {
				debug(`Field with key "${current.key}" discarded: fields must be unique in pass scope.`);
			} else {
				fieldsKeys.add(current.key);
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
		fieldsKeys.delete(element.key);
		return element;
	}

	/**
	 * Like `Array.prototype.splice` but will alter
	 * also uniqueKeys set
	 */

	splice(start, deleteCount, ...items) {
		const removeList = this.slice(start, deleteCount+start);
		removeList.forEach(item => fieldsKeys.delete(item.key));

		return Array.prototype.splice.call(this, start, deleteCount, items);
	}

	get length() {
		return this.length;
	}
}

module.exports = FieldsArray;
