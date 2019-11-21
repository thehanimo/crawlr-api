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
  var expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + 30);
  search
    .insertOne({
      askerID: req.user._id,
      timestamp: Date.now(),
      searchQuery: req.body.searchQuery,
      status: "P",
      expireAt: expireDate
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
          res
            .status(200)
            .json({
              id: result.insertedId
            })
            .end();
          var options = {
            host: "crawlr-core.herokuapp.com",
            // host: "localhost",
            // port: 8000,
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
    .findOne({ _id: SearchID }, { result: 1, askerID: 1 })
    .then(doc => {
      if (req.user._id.toString() !== doc.askerID.toString()) {
        res.status(401).end();
        return;
      }
      res.json({ result: doc.result });
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
        if (searchDoc) data.push({ ...searchDoc });
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
  mainErr = req.body.result.MAIN_ERROR;
  error = req.body.result.error || mainErr ? "ERR" : "D";
  id = req.body.id;
  out = req.body.result;
  term = req.body.term;
  delete out["id"];
  var SearchID = new ObjectID(id);

  if (error !== "ERR") {
    const trending = client.db("crawlr").collection("trending");

    curr = new Date();

    nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 31, 0, 0);

    var minutesRemaining = new Date(nextHour - curr).getMinutes();

    if (minutesRemaining < 5)
      nextHour.setHours(nextHour.getHours() + 2, 31, 0, 0);

    trending.findOne({ searchQuery: term }).then(doc => {
      if (!doc) {
        trending.insertOne({
          expireAt: nextHour,
          searchQuery: term,
          points: 100
        });
      } else {
        trending.updateOne(
          { searchQuery: term },
          {
            $set: {
              points: doc.points + 100,
              expireAt: nextHour
            }
          }
        );
      }
    });
  }

  search.findOne({ _id: SearchID }).then(doc => {
    if (doc.status === "C") {
      res.status(200).end();
      return;
    }
    search.updateOne(
      { _id: SearchID },
      {
        $set: {
          result: out,
          status: error,
          MAIN_ERROR: mainErr ? mainErr : false
        }
      }
    );
    res.status(200).end();
  });
});

router.delete(
  "/cancel",
  passport.authenticate("jwt", { session: false }),
  function(req, res) {
    const search = client.db("crawlr").collection("search");
    var SearchID = new ObjectID(req.query.id);
    search.findOne({ _id: SearchID }).then(doc => {
      if (req.user._id.toString() !== doc.askerID.toString()) {
        res.status(401).end();
        return;
      }
      search.updateOne(
        { _id: SearchID },
        {
          $set: {
            status: "C",
            MAIN_ERROR: "You cancelled this search"
          }
        }
      );
      res.status(200).end();
    });
  }
);

module.exports = router;
