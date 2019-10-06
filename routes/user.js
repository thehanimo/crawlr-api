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
    replies: req.user.replies,
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
      { id: req.user.id, provider: req.user.provider },
      {
        $set: {
          image: req.body.image || req.user.image,
          fullName: req.body.fullName || req.user.fullName,
          questions: req.body.questions || req.user.questions,
          searches: req.body.searches || req.user.searches,
          replies: req.body.replies || req.user.replies,
          email: req.body.email || req.user.email,
          bio: req.body.bio || req.user.bio
        }
      }
    )
    .then(() => res.status(200).end())
    .catch(() => res.status(500).end());
});

module.exports = router;
