// @ts-check

/**
 * @type {import("jest").Config}
 */

export default {
	moduleFileExtensions: ["js", "mjs", "cjs"],
	testEnvironment: "node",
	testMatch: ["**/specs/**/*.spec.mjs"],
	injectGlobals: false,
};
