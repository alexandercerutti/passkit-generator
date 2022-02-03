# Cloudflare Workers example (wrangler)

This is a sample project for showing passkit-generator working on a Cloudflare Worker.

Cloudflare Workers are serverless function based on Browser's V8 (instead of Node). For this reason several APIs require to be polyfilled.

Cloudflare Workers have a tool, wrangler, which comes out with Webpack 4 to bundle things and polyfill those missing Node.JS APIs (e.g. Buffer).

This example offers just the generation of a single static `boardingPass`.

> Please note that creating and publishing a Cloudflare Workers with passkit-generator, might require you to buy a plan.
> With this example, we are bundling some data inline in the code and we have assets that might take a while for being processed.
> Cloudflare limits are pretty low.

## Set up

Install all the dependencies through `npm install`.
Configure wrangler and your account [according to the guide](https://developers.cloudflare.com/workers/get-started/guide).

### Secrets and certificates

This example uses some environmental variables (secrets), which can be set through Wrangler CLI or through Dashboard, as per [this official guide](https://developers.cloudflare.com/workers/platform/environment-variables#adding-secrets-via-wrangler):

-   `SIGNER_CERT`
-   `SIGNER_KEY`
-   `SIGNER_PASSPHRASE`
-   `WWDR`

So, assuming you have `certificates` folder in the root of passkit-generator, you'll be able to do such:

```sh
$ cat ../../../certificates/signerKey.pem | npx wrangler secret put SIGNER_KEY
```

These variables are exposed on `globalThis`.

### Running locally

To run the worker locally, run `npm run example`. This command will run the webserver on `0.0.0.0`, so it can also be accessed from other devices on the network.

### Publishing

To publish the worker, you'll need to run `npx wrangler whoami` to get the Account ID. Set it to `account_id` in `wrangler.toml`.

## Example details

Since our project is made in Typescript, we needed a way to compile it. The way shown, uses `ts-loader`.

As per `ts-loader` dependencies, it required webpack to be `*`, so v5 would automatically get download.

For this reason we also needed to add Webpack 4 (the one provided with Wrangler) as a dev dependency.

Along with this, we needed to setup a different `webpack.config.js` and tell wrangler where to find it, through `wrangler.toml`.

Also, we needed to install `url-loader` to load static assets (model files from models folder). Better ways to achieve this might be available (like [Durable Objects](https://developers.cloudflare.com/workers/runtime-apis/durable-objects), maybe).

To "conclude", we needed to set `type = "webpack"` on the top of `wrangler.toml`, as per [the documentation](https://developers.cloudflare.com/workers/cli-wrangler/webpack).

Other details can be found inline as code comment.
