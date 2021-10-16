/*
 * Generic webserver instance for the examples
 * @Author Alexander P. Cerutti
 * Requires express to run
 */

import express from "express";
export const app = express();

app.use(express.json());

app.listen(8080, "0.0.0.0", () => {
	console.log("Webserver started.");
});

app.all("/", function (_, response) {
	response.redirect("/gen/");
});

app.route("/gen").all((req, res) => {
	res.set("Content-Type", "text/html");
	res.send(
		"Cannot generate a pass. Specify a modelName in the url to continue. <br/>Usage: /gen/<i>modelName</i>",
	);
});

export default app.route("/gen/:modelName");
