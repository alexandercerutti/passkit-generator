const express = require("express");
const { RequestHandler } = require("./index")

const instance = express();

instance.use(express.json());

instance.listen(80, "0.0.0.0", function(request, response) {
	console.log("Listening on 80");
});

instance.get("/", function (request, response) {
	response.send("Hello there!");
});

instance.get("/gen/:type/", RequestHandler);
instance.post("/gen/:type/", RequestHandler);
