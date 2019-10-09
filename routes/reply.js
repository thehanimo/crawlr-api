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
    .updateOne(
      {
        _id: new ObjectID(req.body.QuestionID)
      },
      {
        $push: {
          replies: {
            $each: [
              {
                _id: new ObjectID(),
                body: req.body.reply,
                responderID: req.user._id,
                timestamp: Date.now()
              }
            ],
            $position: 0
          }
        }
      }
    )
    .then(() => res.status(200).end())
    .catch(() => res.status(500).end());
});
router.get("/", passport.authenticate("jwt", { session: false }), function(
  req,
  res
) {
  const question = client.db("crawlr").collection("question");
  const user = client.db("crawlr").collection("user");
  var QuestionID = new ObjectID(req.query.questionID);
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
    .findOne({ _id: QuestionID }, { replies: 1 })
    .then(async doc => {
      var data = [];
      var replies = doc.replies;
      for (
        let i = query.skip;
        i < replies.length && i < query.skip + query.limit;
        i++
      ) {
        var item = replies[i];
        var doc = await user.findOne(
          { _id: item.responderID },
          { image: 1, fullName: 1, _id: 1 }
        );
        data.push({
          id: item._id,
          image: doc.image,
          fullName: doc.fullName,
          timestamp: item.timestamp,
          reply: item.body,
          isVerified: item.isVerified,
          UserID: doc._id
        });
      }
      //   data.sort((a, b) => {
      //     if (a.isVerified && b.isVerified) return b.timestamp - a.timestamp;
      //     else if (a.isVerified) return -1;
      //     else return 1;
      //   });
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

router.post(
  "/verify",
  passport.authenticate("jwt", { session: false }),
  function(req, res) {
    const user = client.db("crawlr").collection("user");
    const question = client.db("crawlr").collection("question");
    question
      .updateOne(
        {
          _id: new ObjectID(req.body.QuestionID),
          askerID: req.user._id,
          replies: {
            $elemMatch: {
              _id: new ObjectID(req.body.ReplyID)
            }
          }
        },
        {
          $set: {
            "replies.$.isVerified": true
          }
        }
      )
      .then(() => res.status(200).end())
      .catch(() => res.status(500).end());
  }
);

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
        replies: 1
      }
    )
    .then(async doc => {
      const { replies } = doc;
      for (let i = 0; i < replies.length; i++) {
        if (replies[i]._id.toString() === req.query.ReplyID.toString()) {
          if (
            doc.askerID.toString() === req.user._id.toString() ||
            replies[i].responderID.toString() === req.user._id.toString()
          )
            replies.splice(i, 1);
          break;
        }
      }
      question
        .updateOne(
          {
            _id: new ObjectID(req.query.QuestionID)
          },
          {
            $set: {
              replies: replies
            }
          }
        )
        .then(() => res.status(200).end());
    })
    .catch(() => res.status(500).end());
});

module.exports = router;
