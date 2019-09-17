const passport = require("passport");
const LinkedInStrategy = require("@sokratis/passport-linkedin-oauth2").Strategy;
const keys = require("./keys");

passport.initialize();
passport.session();
passport.use(
  new LinkedInStrategy(
    {
      clientID: keys.linkedIn.clientID,
      clientSecret: keys.linkedIn.clientSecret,
      callbackURL: "https://crawlr-api.herokuapp.com/auth/linkedin/callback",
      profileFields: [
        "formatted-name",
        "headline",
        "id",
        "public-profile-url",
        "email-address",
        "location"
      ],
      scope: ["r_emailaddress", "r_liteprofile"]
    },
    function(accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  )
);
