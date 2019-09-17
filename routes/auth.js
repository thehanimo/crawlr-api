var express = require("express");
var router = express.Router();
const passport = require("passport");
var https = require("https");

router.get(
  "/app/linkedin",
  passport.authenticate("linkedin", { state: "state" }),
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
    var photoURI;
    if (req.user.photos == []) {
      res.json({
        provider: req.user.provider,
        email: req.user.emails[0].value,
        id: req.user.id,
        fullName: req.user.name.givenName + " " + req.user.name.familyName,
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
            return;
          });
        })
        .on("error", e => {
          console.log(`Got error: ${e.message}`);
        });
    }
  }
);

router.get("/linkedin/callback", (req, res) => {
  res.redirect(`crawlr://login/${req._parsedOriginalUrl.search}`);
});

router.post("/confirm", (req, res) => {
  //Extract req.body and save provider-id to db here!!
  statusMessage = "Registered!";
  res.status(200).end();
});

router.post("/register", (req, res) => {
  //Extract req.body and save/update profile to db here!!
  statusMessage = "Registered!";
  res.status(200).end();
});
module.exports = router;
