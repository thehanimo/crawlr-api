var express = require("express");
var router = express.Router();
const passport = require("passport");
const client = require("../db");
const ObjectID = require("mongodb").ObjectID;

router.get("/", function(req, res) {
  const trending = client.db("crawlr").collection("trending");

  trending
    .find()
    .project({ searchQuery: 1, points: 1 })
    .sort({ points: -1 })
    .limit(10)
    .toArray()
    .then(data => {
      res.status(200).json({
        data
      });
    });
});

module.exports = router;
