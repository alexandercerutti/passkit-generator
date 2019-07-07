const schema = require("./schema");
const debug = require("debug")("passkit:fields");

/**
 * Class to represent lower-level keys pass fields
 * @see https://apple.co/2wkUBdh
 */

const poolSymbol = Symbol("pool");

class FieldsArray extends Array {
	
	constructor(pool,...args) {
		super(...args);
		this[poolSymbol] = pool;
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

			if (this[poolSymbol].has(current.key)) {
				debug(`Field with key "${current.key}" discarded: fields must be unique in pass scope.`);
			} else {
				this[poolSymbol].add(current.key);
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
		this[poolSymbol].delete(element.key)
		return element;
	}

	/**
	 * Like `Array.prototype.splice` but will alter
	 * also uniqueKeys set
	 */

	splice(start, deleteCount, ...items) {
		const removeList = this.slice(start, deleteCount+start);
		removeList.forEach(item => this[poolSymbol].delete(item.key));

		return Array.prototype.splice.call(this, start, deleteCount, items);
	}

	get length() {
		return this.length;
	}
}

module.exports = FieldsArray;
