import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import webpack from "webpack";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @see https://developers.cloudflare.com/workers/cli-wrangler/webpack
 */

export default {
	context: __dirname,
	entry: "./src/index.ts",
	target: "webworker",

	/**
	 * "development" mode does not support the usage of eval
	 * If you want to run in dev mode and not use eval, add
	 * to the configuration:
	 *
	 * ```
	 * devtool: "inline-source-map",
	 * ```
	 *
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
				test: /\.png/,
				type: "asset/inline",
			},
		],
	},
	resolve: {
		extensions: [".ts", ".js", ".png"],
		fallback: {
			fs: false /* Do not include a polyfill for fs */,
			stream: require.resolve("stream-browserify"),
			buffer: require.resolve("buffer/"),
			os: require.resolve("os-browserify/browser"),
			path: require.resolve("path-browserify"),
		},
	},
	output: {
		filename: "worker.js" /** This name is required */,
		path: path.resolve(__dirname, "dist"),
	},

	/**
	 * This is required because some passkit-generator dependencies
	 * use Buffer on global instead of importing it explictly
	 */

	plugins: [
		new webpack.ProvidePlugin({
			Buffer: ["buffer", "Buffer"],
		}),
	],
};
