const path = require("path");

/**
 * @see https://developers.cloudflare.com/workers/cli-wrangler/webpack
 */

module.exports = {
	context: __dirname,
	entry: "./src/index.ts",
	target: "webworker",

	/**
	 * "development" mode does not support the usage of eval
	 * @see https://github.com/cloudflare/wrangler/issues/1268
	 */

	mode: "production",
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
			{
				test: /\.png$/i,
				use: [
					{
						/**
						 * These settings seems necessary
						 * so we can import our model inside
						 * the final output, just like we are
						 * importing assets as esm modules.
						 *
						 * url-loader uses a generator to wrap
						 * output with mimetype, encodign, etc.
						 * but we just need the un-encoded content.
						 */

						loader: "url-loader",
						options: {
							encoding: false,
							generator: (
								content,
								mimetype,
								encoding,
								resourcePath,
							) => {
								return content;
							},
						},
					},
				],
			},
		],
	},
	resolve: {
		extensions: [".ts", ".js", ".png"],
	},
	output: {
		filename:
			"worker.js" /** This name is required to be "worker.js" for wrangler */,
		path: path.resolve(__dirname, "dist"),
	},

	/**
	 * Passkit-generator uses `fs` module, but
	 * cloudflare worker is a browser-like environment
	 * or an hybrid system between browser and node
	 * that doesn't allow using file system because
	 * workers should be single files (and modules
	 * support it still beta as now), plus assets.
	 *
	 * We are going to import our model as single assets
	 */

	node: {
		fs: "empty",
	},
};
