var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
var https = require("https");
const client = require("../db");

router.get(
  "/app/linkedin",
  passport.authenticate("linkedin", { state: "state" }),
  function(req, res) {
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
  }
);

router.get(
  "/linkedin",
  passport.authenticate("linkedin", { state: "webapp" }),
  function(req, res) {
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
  }
);

router.post(
  "/linkedin/callback",
  passport.authenticate("linkedin", {
    session: false
  }),
  function(req, res) {
    const user = client.db("crawlr").collection("user");
    user
      .findOne(
        { id: req.user.id, provider: req.user.provider },
        { id: 1, provider: 1, fullName: 1 }
      )
      .then(doc => {
        if (!doc || !doc.fullName) {
          //Check if new user or unconfirmed user
          if (!doc) {
            user.insertOne({
              provider: req.user.provider,
              id: req.user.id,
              email: req.user.emails[0].value
            });
          }
          var photoURI;
          if (!req.user.photos) {
            res.json({
              provider: req.user.provider,
              email: req.user.emails[0].value,
              id: req.user.id,
              fullName:
                req.user.name.givenName + " " + req.user.name.familyName,
              image: null
            });
          } else {
            https
              .get(req.user.photos[req.user.photos.length - 1].value, resp => {
                resp.setEncoding("base64");
                photoURI = "data:" + resp.headers["content-type"] + ";base64,";
                resp.on("data", data => {
                  photoURI += data;
                });
                resp.on("end", () => {
                  res.json({
                    provider: req.user.provider,
                    email: req.user.emails[0].value,
                    id: req.user.id,
                    fullName:
                      req.user.name.givenName + " " + req.user.name.familyName,
                    image: photoURI
                  });
                });
              })
              .on("error", e => {
                res.status(500).end();
              });
          }
        } else {
          var token = jwt.sign(
            JSON.parse(JSON.stringify({ id: doc.id, provider: doc.provider })),
            "nodeauthsecret",
            { expiresIn: 365 * 24 * 60 * 60 * 1000 }
          );
          res.json({
            JWT: "JWT " + token,
            UserID: doc._id
          });
        }
      });
  }
);

router.get("/linkedin/callback", (req, res) => {
  if (req.query.state === "state")
    res.redirect(`crawlr://login/${req._parsedOriginalUrl.search}`);
  else
    res.redirect(
      `http://localhost:8000/login/${req._parsedOriginalUrl.search}`
    );
});

router.post("/confirm", (req, res) => {
  const user = client.db("crawlr").collection("user");
  user
    .findOne(
      { id: req.body.id, provider: req.body.provider },
      { id: 1, provider: 1, email: 1, _id: 1 }
    )
    .then(doc => {
      if (doc) {
        var token = jwt.sign(
          JSON.parse(JSON.stringify({ id: doc.id, provider: doc.provider })),
          "nodeauthsecret",
          {
            expiresIn: 365 * 24 * 60 * 60 * 1000
          }
        );
        user
          .updateOne(
            { id: req.body.id, provider: req.body.provider },
            {
              $set: {
                email: doc.email,
                rawImage: req.body.image,
                image: `https://crawlr-api.herokuapp.com/user/image?id=${
                  doc._id
                }&timestamp=${Date.now()}`,
                fullName: req.body.fullName,
                bio: "",
                isPremiumUser: false,
                paymentID: null,
                questions: 0,
                searches: [],
                joinDate: Date.now()
              }
            }
          )
          .then(() => {
            res.json({
              JWT: "JWT " + token,
              UserID: doc._id
            });
          });
      } else {
        res.status(401).end();
      }
    });
});

router.post("/test", passport.authenticate("jwt", { session: false }), function(
  req,
  res
) {
  res.status(200).end();
});
module.exports = router;
