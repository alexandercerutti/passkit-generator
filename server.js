const express = require("express");
const passkit = require("./index");

passkit.init("./config.json");

const instance = express();

instance.use(express.json());

instance.listen(80, "0.0.0.0", function(request, response) {
	console.log("Listening on 80");
});

instance.get("/", function (request, response) {
	response.send("Hello there!");
});

instance.get("/gen/:type/",passkit.RequestHandler);
instance.post("/gen/:type/", passkit.RequestHandler);
