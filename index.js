let express = require("express");
let instance = express();


instance.listen(80, "127.0.0.1", function(req, res) {
	console.log("Listening on 80")
});

instance.get("/", function (req, res) {
	res.send("Hello there")
});

instance.on("error", function() {
	console.log("got error");
})
