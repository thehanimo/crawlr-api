var express = require("express");
var router = express.Router();
const passport = require("passport");
const client = require("../db");
const ObjectID = require("mongodb").ObjectID;
var http = require("http");

router.post("/", passport.authenticate("jwt", { session: false }), function(
  req,
  res
) {
  const user = client.db("crawlr").collection("user");
  const search = client.db("crawlr").collection("search");
  search
    .insertOne({
      askerID: req.user._id,
      timestamp: Date.now(),
      searchQuery: req.body.searchQuery,
      status: "P"
    })
    .then(result => {
      user
        .updateOne(
          { _id: req.user._id },
          {
            $push: {
              searches: {
                $each: [
                  {
                    _id: result.insertedId
                  }
                ],
                $position: 0
              }
            }
          }
        )
        .then(() => {
          res.status(200).end();
          var options = {
            host: "crawlr-core.herokuapp.com",
            path: `/api/?q=${req.body.searchQuery}&id=${result.insertedId}`
          };

          http.get(options, function(res) {
            if (res.statusCode !== 200) {
              search.updateOne(
                { _id: result.insertedId },
                { $set: { status: "ERR" } }
              );
            }
          });
        });
    })
    .catch(() => res.status(500).end());
});

router.get("/", passport.authenticate("jwt", { session: false }), function(
  req,
  res
) {
  const search = client.db("crawlr").collection("search");
  const user = client.db("crawlr").collection("user");
  var SearchID = new ObjectID(req.query.searchID);

  search
    .findOne({ _id: SearchID })
    .then(doc => {
      if (req.user.id !== doc.askerID) {
        res.status(401).end();
        return;
      }
      res.json(doc);
    })
    .catch(err => {
      console.log(err);
      res.status(500).end();
    });
});

router.post("/result", function(req, res) {
  const search = client.db("crawlr").collection("search");
  error = req.body.error;
  id = req.body.id;
  out = req.body;
  delete out["id"];
  var SearchID = new ObjectID(id);
  search.updateOne(
    { _id: SearchID },
    {
      $set: {
        result: out,
        status: error ? "ERR" : "D"
      }
    }
  );
  res.status(200).end();
});

module.exports = router;
