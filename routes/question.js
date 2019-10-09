var express = require("express");
var router = express.Router();
const passport = require("passport");
const client = require("../db");
const ObjectID = require("mongodb").ObjectID;

router.post("/", passport.authenticate("jwt", { session: false }), function(
  req,
  res
) {
  const user = client.db("crawlr").collection("user");
  const question = client.db("crawlr").collection("question");
  question
    .insertOne({
      askerID: req.user._id,
      timestamp: Date.now(),
      body: req.body.question,
      replies: []
    })
    .then(() => {
      user
        .updateOne(
          { _id: req.user._id },
          {
            $set: {
              questions: req.user.questions + 1
            }
          }
        )
        .then(() => res.status(200).end());
    })
    .catch(() => res.status(500).end());
});
router.get("/all", passport.authenticate("jwt", { session: false }), function(
  req,
  res
) {
  const question = client.db("crawlr").collection("question");
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

  question
    .find()
    .skip(query.skip)
    .limit(query.limit)
    .sort({ timestamp: -1 })
    .toArray()
    .then(async docArray => {
      var data = [];
      for (let i = 0; i < docArray.length; i++) {
        var item = docArray[i];
        var doc = await user.findOne(
          { _id: item.askerID },
          { image: 1, fullName: 1 }
        );
        data.push({
          id: item._id,
          askerID: item.askerID,
          image: doc.image,
          fullName: doc.fullName,
          timestamp: item.timestamp,
          replies: item.replies.length,
          question: item.body
        });
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

router.delete("/", passport.authenticate("jwt", { session: false }), function(
  req,
  res
) {
  const user = client.db("crawlr").collection("user");
  const question = client.db("crawlr").collection("question");
  question
    .findOne(
      { _id: new ObjectID(req.query.QuestionID) },
      {
        askerID: 1,
        _id: 1
      }
    )
    .then(async doc => {
      if (req.user._id.toString() !== doc.askerID.toString())
        res.status(500).end();
      question.deleteOne({ _id: doc._id }).then(() => {
        user
          .updateOne(
            { _id: req.user._id },
            {
              $set: {
                questions: req.user.questions - 1
              }
            }
          )
          .then(() => res.status(200).end());
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).end();
    });
});

module.exports = router;
