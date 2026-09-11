// @ts-check

/**
 * Tests that build dates out of their components (`new Date(y, m, d, ...)`)
 * would otherwise depend on the machine's timezone: the same test would
 * produce a different UTC instant on a maintainer's machine and on CI.
 * Pinning the timezone here makes local runs match the GitHub Actions
 * runners, which run in UTC.
 */

process.env.TZ = "UTC";

/**
 * @type {import("jest").Config}
 */

export default {
	moduleFileExtensions: ["js", "mjs", "cjs"],
	/**
	 * The specs import the package by its bare name, which used to resolve
	 * through Node's self-reference on `name`. The package is published under
	 * the @jericommerce scope, so that self-reference no longer matches. Map
	 * the bare name back to the build to keep the specs identical to
	 * upstream's.
	 */
	moduleNameMapper: {
		"^passkit-generator$": "<rootDir>/lib/esm/index.js",
	},
	testEnvironment: "node",
	testMatch: ["**/specs/**/*.spec.mjs"],
	injectGlobals: false,
};
