// @ts-check

/**
 * @type {import("jest").Config}
 */

module.exports = {
	moduleFileExtensions: ["js", "mjs", "cjs"],
	testEnvironment: "node",
	testMatch: ["**/specs/**/*.spec.cjs"],
	injectGlobals: false,
};
