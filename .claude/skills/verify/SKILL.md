---
name: verify
description: Build the passkit-generator library, run its tests and generate a real .pkpass from the examples to confirm a change produces a valid pass. Use before committing a code change to this repo and whenever asked to verify one.
---

# Verify: passkit-generator

Recipe for this repo. Edit it only when a step fails or is missing. Skip it for changes that only touch docs or tests.

## 1. Prepare and gate

```bash
pnpm install --frozen-lockfile
pnpm build && pnpm test
node scripts/check-pack.mjs        # what `prepublishOnly` checks before a release
```

## 2. Generate a pass

Run the example in `examples/` (`self-hosted` is the simplest) closest to the change against the fresh `lib/` build, with test certificates. Unzip the resulting `.pkpass` and check `pass.json`, `manifest.json` (hashes match the files) and that `signature` is present. If the change affects how a pass looks, open it in the iOS Simulator's Wallet or on a device and take a screenshot.

## 3. Evidence

In your final message (or `worker_done`): build, tests and pack check with pass/fail, the example you ran, what you checked in the pass, and screenshot paths if any.

## Never

Publish to npm, or use production signing certificates or real customer data in examples.
