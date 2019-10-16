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
            auth: "crawlrTopSecret",
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

router.get("/all", passport.authenticate("jwt", { session: false }), function(
  req,
  res
) {
  const search = client.db("crawlr").collection("search");
  const user = client.db("crawlr").collection("user");
  var pageNo = parseInt(req.query.pageNo);
  var untilPage = parseInt(req.query.untilPage);
  var size = 10;
  var query = {};
  if (pageNo < 0 || pageNo === 0) {
    response = {
      error: true,
      message: "invalid page number, should start with 1"
    };
    return res.json(response);
  }
  query.skip = size * (pageNo - 1);
  query.limit = size;
  if (untilPage) {
    query.skip = 0;
    query.limit = size * untilPage;
  }

  user
    .findOne({ _id: req.user._id }, { searches: 1 })
    .then(async doc => {
      var data = [];
      if (query.skip >= doc.searches.length) var searchesArray = [];
      else
        searchesArray = doc.searches.splice(
          query.skip,
          query.skip + query.limit
        );
      for (let i = 0; i < searchesArray.length; i++) {
        var searchID = searchesArray[i]._id;
        var searchDoc = await search.findOne(
          { _id: searchID },
          { _id: 1, timestamp: 1, searchQuery: 1, status: 1 }
        );
        data.push({ ...searchDoc });
      }
      res.json({
        data,
        pageNo,
        untilPage: untilPage ? true : false
      });
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
