/*
 * Generic webserver instance for the examples
 * @Author Alexander P. Cerutti
 * Requires express to run
 */

const express = require("express");
const app = express();

app.use(express.json());

app.listen(8080, "0.0.0.0", function(request, response) {
	console.log("Webserver started.");
});

app.all("/", function (request, response) {
	response.redirect("/gen/");
});

app.route("/gen")
	.all((req, res) => {
		res.set("Content-Type", "text/html");
		res.send("Cannot generate a pass. Specify a modelName in the url to continue. <br/>Usage: /gen/<i>modelName</i>")
	});

module.exports = app.route("/gen/:modelName");
