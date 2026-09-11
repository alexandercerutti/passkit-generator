/**
 * Fails the publish if the tarball would not contain the build output.
 *
 * 3.6.0 shipped with only README, LICENSE, package.json and `main`: pnpm 12
 * silently ignores extglob patterns in `files` (e.g. `*.+(js*)`), while npm
 * honours them. Everything was on disk, so checking lib/ is not enough —
 * this asks every packer what it would actually put in the tarball.
 */

import { execFileSync } from "node:child_process";

const REQUIRED_FILES = [
	"lib/cjs/index.js",
	"lib/cjs/package.json",
	"lib/cjs/PKPass.js",
	"lib/esm/index.js",
	"lib/esm/package.json",
	"lib/esm/PKPass.js",
	"lib/types/index.d.ts",
];

const PACKERS = {
	npm: (json) => json[0].files.map((file) => file.path),
	pnpm: (json) => json.files.map((file) => file.path),
};

let failed = false;

for (const [packer, listFiles] of Object.entries(PACKERS)) {
	const output = execFileSync(packer, ["pack", "--dry-run", "--json"], {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "ignore"],
	});

	const files = new Set(listFiles(JSON.parse(output)));
	const missing = REQUIRED_FILES.filter((file) => !files.has(file));

	if (missing.length) {
		failed = true;
		console.error(
			`${packer} pack would ship ${files.size} files and miss: ${missing.join(", ")}`,
		);
	} else {
		console.log(
			`${packer} pack: ${files.size} files, required files present`,
		);
	}
}

if (failed) {
	process.exit(1);
}
