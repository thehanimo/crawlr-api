var express = require("express");
var router = express.Router();
const passport = require("passport");
const client = require("../db");
const ObjectID = require("mongodb").ObjectID;

router.get("/", passport.authenticate("jwt", { session: false }), function(
  req,
  res
) {
  var uid = req.query.uid;
  var one_day = 1000 * 60 * 60 * 24;
  var present_date = new Date();
  const user = client.db("crawlr").collection("user");

  if (!uid) {
    joinDate = new Date(req.user.joinDate);
    var Result =
      Math.round(present_date.getTime() - joinDate.getTime()) / one_day;
    var karma = Math.floor(
      Result.toFixed(0) + req.user.searches + req.user.questions * 0.5
    );
    res.status(200).json({
      image: req.user.image,
      fullName: req.user.fullName,
      questions: req.user.questions,
      searches: req.user.searches,
      karma,
      email: req.user.email,
      bio: req.user.bio,
      isPremiumUser: req.user.isPremiumUser
    });
  } else {
    var UserID = new ObjectID(uid);
    user.findOne({ _id: UserID }).then(doc => {
      joinDate = new Date(doc.joinDate);
      var Result =
        Math.round(present_date.getTime() - joinDate.getTime()) / one_day;
      var karma = Math.floor(
        Result.toFixed(0) + doc.searches + doc.questions * 0.5
      );
      res.status(200).json({
        image: doc.image,
        fullName: doc.fullName,
        questions: doc.questions,
        searches: doc.searches,
        karma,
        email: doc.email,
        bio: doc.bio,
        isPremiumUser: doc.isPremiumUser
      });
    });
  }
});

router.post("/", passport.authenticate("jwt", { session: false }), function(
  req,
  res
) {
  const user = client.db("crawlr").collection("user");
  user
    .updateOne(
      { _id: req.user._id },
      {
        $set: {
          rawImage: req.body.image || req.user.rawImage,
          image: req.body.image
            ? `https://crawlr-api.herokuapp.com/user/image?id=${
                req.user._id
              }&timestamp=${Date.now()}`
            : req.user.image,
          fullName: req.body.fullName || req.user.fullName,
          bio: req.body.bio || req.user.bio,
          isPremiumUser: req.body.paymentID ? true : false,
          paymentID: req.body.paymentID || null
        }
      }
    )
    .then(() => res.status(200).end())
    .catch(() => res.status(500).end());
});

router.get("/image", function(req, res) {
  const user = client.db("crawlr").collection("user");
  var userID = req.query.id;
  user.findOne({ _id: new ObjectID(userID) }, { image: 1 }).then(doc => {
    if (!doc || !doc.rawImage) return res.status(404).end();
    var contentType = doc.rawImage
      .split(",")[0]
      .replace("data:", "")
      .split(";")[0];

    var img = Buffer.from(doc.rawImage.split(",")[1], "base64");
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": img.length
    });
    res.end(img);
  });
});

module.exports = router;
