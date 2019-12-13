var express = require("express");
var router = express.Router();
var https = require("https");

/* GET home page. */
router.get("/", function(req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/email", function(req, res) {
  var email = req.query.id;
  if (!email) {
    res.status(500).end();
    return;
  }
  var options = {
    host: "disposable.debounce.io",
    path: `/?email=${email}`
  };
  console.log(options);

  https.get(options, function(res2) {
    res2.setEncoding("utf8");
    res2.on("data", function(chunk) {
      res.json(JSON.parse(chunk));
      return;
    });
  });
});

module.exports = router;
