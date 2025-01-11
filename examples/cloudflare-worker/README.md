# Cloudflare Workers example (wrangler)

This is a sample project for showing passkit-generator working on a Cloudflare Worker.

Cloudflare Workers are serverless function based on Browser's V8 (instead of Node). For this reason Cloudflare workers are need to setup to support node compatibility (see wranger.toml).

This example offers just the generation of a single static `boardingPass`.

> Please note that creating and publishing a Cloudflare Workers with passkit-generator, might require you to buy a plan.
> Cloudflare limits are pretty low.

## Setting up

Install the dependencies from wherever path you are with `pnpm install`. Installing the dependencies will link passkit-generator in the parent workspace, so to reflect any change, it will be enough to build passkit-generator and restart the example.

Configure wrangler and your account [according to the guide](https://developers.cloudflare.com/workers/get-started/guide).
You are always suggested to start with a brand new project and to not clone this one, so that you won't miss any configuration you might need.

### Secrets and certificates

This example uses some environmental variables (secrets), which can be set through Wrangler CLI, through Dashboard or through `wrangler.toml`, as per [envs documentation](https://developers.cloudflare.com/workers/platform/environment-variables#adding-secrets-via-wrangler) and [secrets documentation](https://developers.cloudflare.com/workers/configuration/secrets/):

-   `SIGNER_CERT`
-   `SIGNER_KEY`
-   `SIGNER_PASSPHRASE`
-   `WWDR`

So, assuming you have `certificates` folder in the root of passkit-generator and all the dependencies installed, you'll be able to directly inject your secrets into wrangler by doing this.

```sh
$ cat ../../../certificates/signerKey.pem | pnpm wrangler secret put SIGNER_KEY
```

These variables are exposed on `env` when performing the request.

For the sake of the example, `signerCert`, `signerKey`, `signerKeyPassphrase` and `wwdr` are set to be distributed through `wrangler.toml`, but you should keep them safe in the secrets storage above.

### Running locally

Install dependencies via `npm install`. Then, to run the worker locally, run `npm run example`.

### Example details

Several details are described inside the `wrangler.toml` file. Give them a look.
