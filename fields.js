const schema = require("./schema");

/**
 * Class to represent lower-level keys pass fields
 * @see https://apple.co/2wkUBdh
 */

class FieldsContainer {
	constructor() {
		this._uniqueKeys = [];
		this.fields = [];
	}

	/**
	 * A wrapper of Array.prototype.push to validate the pushed content with the schema.
	 * Accepts also one array of objects.
	 *
	 * @method push
	 * @params {Object[]} fields - the fields to be checked and pushed
	 * @params {schema.field} fields[].* - each key must be compliant with schema.field structure
	 * @returns {Number} - the amount of pushed elements (for checks)
	 */

	push(...fieldsData) {
		if (fieldsData[0] instanceof Array && fieldsData[0].length) {
			fieldsData = fieldsData[0];
		}

		let validFields = fieldsData.filter(f => {
			if (this._uniqueKeys.includes(f.key)) {
				return false;
			}

			this._uniqueKeys.push(f.key);

			return typeof f === "object" && schema.isValid(f, "field");
		});

		this.fields.push(...validFields);

		return validFields.length;
	}

	/**
	 * A wrapper of Array.prototype.pop and Array.prototype.slice to pop
	 * last element or n elements starting from the end.
	 *
	 * @method pop
	 * @params {Number} [quantity=-1] - the amount of elements to be removed
	 * @returns {Number} - the amount of removed elements
	 */

	pop(amount = -1) {
		if (!this.fields.length) {
			return undefined;
		}

		if (amount > -1) {
			let removedElements = this.fields.slice(amount);
			this.fields = this.fields.slice(0, this.fields.length - amount);
			this._uniqueKeys = this._uniqueKeys.slice(0, this._uniqueKeys - amount);

			return removedElements;
		}

		this._uniqueKeys.pop();
		return this.fields.pop();
	}
}

module.exports = FieldsContainer;
