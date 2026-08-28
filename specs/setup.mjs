// @ts-check

/**
 * Tests that build dates out of their components (`new Date(y, m, d, ...)`)
 * would otherwise depend on the machine's timezone: the same spec would
 * produce a different UTC instant on a maintainer's machine and on CI.
 * Pinning the timezone here makes local runs match the Github Actions
 * runners, which run in UTC.
 *
 * This is preloaded through `--import` in the `test` script, so it applies
 * to every process the test runner spawns for the spec files.
 */

process.env.TZ = "UTC";
