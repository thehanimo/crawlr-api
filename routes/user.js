var express = require("express");
var router = express.Router();
const passport = require("passport");
const client = require("../db");

router.get("/", passport.authenticate("jwt", { session: false }), function(
  req,
  res
) {
  res.json({
    image: req.user.image,
    fullName: req.user.fullName,
    questions: req.user.questions,
    searches: req.user.searches,
    karma: req.user.karma,
    email: req.user.email,
    bio: req.user.bio
  });
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
          image: req.body.image || req.user.image,
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

module.exports = router;
