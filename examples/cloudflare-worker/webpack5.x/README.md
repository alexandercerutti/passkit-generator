# Cloudflare Workers example (wrangler + Webpack 5)

This is a sample project for showing passkit-generator working on a Cloudflare Worker.

Cloudflare Workers are serverless function based on Browser's V8 (instead of Node). For this reason several APIs require to be polyfilled.

Cloudflare Workers have a tool, wrangler, which comes out with Webpack 4 to bundle things and polyfill those missing Node.JS APIs (e.g. Buffer).

**In this example aims, instead, to show how to build with Webpack 5 instead of Webpack 4.**

This example offers just the generation of a single static `boardingPass`.

> Please note that creating and publishing a Cloudflare Workers with passkit-generator, might require you to buy a plan.
> Cloudflare limits are pretty low.

## Setting up

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

As per `ts-loader` dependencies, it required webpack to be `*`, so v5 would automatically get download. We added webpack explicitly, so we don't leave anything undetailed.

Along with this, we needed to setup a different `webpack.config.js` and tell wrangler where to find it, through `wrangler.toml`.

`webpack.config.js` will detail several things for us:

-   how to handle module assets, through [Asset Modules](https://webpack.js.org/guides/asset-modules/), in a way we can still import them with ES Modules syntax;
-   Node.JS modules that will get polyfilled;
-   Modules that [will be provided everywhere without the need to import them explicitly](https://webpack.js.org/plugins/provide-plugin/). This is the case of Node.js APIs and modules, like Buffer, which is available on both `global` and through `Buffer` module. Since Buffer must be polyfilled "manually", this allows us to tell modules Buffer should be imported in for compatibility (e.g. do-not-zip);

Another detail you should pay attention to, is that `package.json`'s `main` field **should be your worker entry-point**, as per [cloudflare documentation (paragraph)](https://developers.cloudflare.com/workers/cli-wrangler/configuration#:~:text=ensure%20the%20main%20field%20in%20your%20package.json%20references%20the%20worker%20script%20you%20want%20to%20publish)

Lastly, we needed to set `type = "javascript"` on the top of `wrangler.toml`, as per [the documentation](https://developers.cloudflare.com/workers/cli-wrangler/webpack) and set a custom build command as per the documentation as well (same link as above).
