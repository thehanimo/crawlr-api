var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var authRouter = require("./routes/auth");
var userRouter = require("./routes/user");
var questionRouter = require("./routes/question");
var replyRouter = require("./routes/reply");
var searchRouter = require("./routes/search");
const passportSetup = require("./config/passport-setup");
var swaggerUi = require("swagger-ui-express");
var swaggerDocument = require("./swagger.json");

// Swagger-UI disable Try it Out
const DisableTryItOutPlugin = function() {
  return {
    statePlugins: {
      spec: {
        wrapSelectors: {
          allowTryItOutFor: () => () => false
        }
      }
    }
  };
};
const options = {
  swaggerOptions: {
    plugins: [DisableTryItOutPlugin]
  }
};

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.get("/logo.jpg", (req, res) => {
  res.sendFile(path.join(__dirname, "./public/images/logo.jpg"));
});
app.use("/", indexRouter);
app.use("/question", questionRouter);
app.use("/reply", replyRouter);
app.use("/search", searchRouter);
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, options)
);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
