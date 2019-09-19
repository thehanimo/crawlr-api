const passport = require("passport");
const LinkedInStrategy = require("@sokratis/passport-linkedin-oauth2").Strategy;
const keys = require("./keys");
const client = require("../db");
const JwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt;

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("JWT"),
  secretOrKey: "nodeauthsecret"
};
passport.use(
  "jwt",
  new JwtStrategy(opts, function(jwt_payload, done) {
    const oauth = client.db("crawlr").collection("oauth");
    oauth
      .findOne({ id: jwt_payload.id, provider: jwt_payload.provider })
      .then(doc => {
        return done(null, doc);
      })
      .catch(error => {
        return done(error, false);
      });
  })
);

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
