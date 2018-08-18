const schema = require("./schema");

class FieldsArea {
	constructor() {
		this.fields = [];
	}

	push(...fields) {
		if (fields[0] instanceof Array && fields[0].length) {
			fields = fields[0];
		}

		let validFields = fields.filter(f => typeof f === "object" && schema.isValid(f, schema.constants.field));

		this.fields.push(...validFields);

		return validFields.length;
	}

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

module.exports = {
	areas: ["primaryFields", "secondaryFields", "auxiliaryFields", "backFields", "headerFields"],
	FieldsArea
};
