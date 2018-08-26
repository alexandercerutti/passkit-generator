const schema = require("./schema");

/**
 * Pass fields area to be used as pass lower level keys
 * @see https://apple.co/2wkUBd
 */

class FieldsContainer {
	constructor() {
		this.fields = [];
	}

	/**
	 * A wrapper of Array.prototype.push to validate the pushed content with the schema.
	 * Accepts also one array of objects.
	 *
	 * @method push
	 * @params {Object[]} fields - the fields to be checked and pushed
	 * @params {schema.constants.field} fields[].* - each key must be compliant with schema.constants.field structure
	 * @returns {Number} - the amount of pushed elements (for checks)
	 */

	push(...fields) {
		if (fields[0] instanceof Array && fields[0].length) {
			fields = fields[0];
		}

		let validFields = fields.filter(f => typeof f === "object" && schema.isValid(f, schema.constants.field));

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

	pop(quantity = -1) {
		if (!this.fields.length) {
			return undefined;
		}

		if (quantity > -1) {
			let removedElements = this.fields.slice(quantity);
			this.fields = this.fields.slice(0, this.fields.length - quantity);

			return removedElements;
		}

		return this.fields.pop();
	}
}

class StringField {
	set transitType(v) {
		if (schema.isValid(v, schema.constants.transitType, true)) {
			this.fields = v;
		} else {
			this.fields = this.fields && this.fields !== "" ? this.fields : "";
		}
	}
	get transitType() {
		return this.fields;
	}
}

module.exports = {
	areas: ["primaryFields", "secondaryFields", "auxiliaryFields", "backFields", "headerFields"],
	FieldsContainer,
	StringField
};
