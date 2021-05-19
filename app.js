require("dotenv").config();
var createError = require("http-errors");
var compression = require("compression");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var nunjucks = require("nunjucks");
var mongoose = require("mongoose");
let update = require("./scripts/main.js");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var dataRouter = require("./routes/data");

var app = express();

//Set up mongoose connection
let mongoDB = process.env.MONGO_DB;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// view engine setup
app.set("views", path.join(__dirname, "views"));
nunjucks.configure("views", {
  express: app,
  autoescape: true,
});
app.set("view engine", "html");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/public")));

app.use("/", indexRouter); // auth routes
app.use("/users", usersRouter); // unauth routes
app.use("/data", dataRouter); // data "api" routes

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
app.use(compression());

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});


// ==== EVENT/UPDATE LOOP 5 min ==== 

// Server side - Update loop
const FIVE_MIN_INTERVAL = 5 * 60 * 1000;

// Wait until next five-minute mark until initialising the update loop
// min_until_start = next five minute mark - current minute
let min_until_start = Math.ceil(new Date().getMinutes() / 5) * 5 - new Date().getMinutes();

console.log(`Minutes until update: ${min_until_start} mins`)
setTimeout(() => {
  setInterval(update.updateFive, FIVE_MIN_INTERVAL)
},
  min_until_start * 60 * 1000 //To get milliseconds
)

// ==== EVENT/UPDATE LOOP 24 hours ==== 
const UPDATE_TIME = "03:00"
const DAY_INTERVAL = 24 * 60 * 60 * 1000
//Create a new date at the specified update time
let update_date = new Date()
update_date.setDate(new Date().getDate() + 1)
update_date.setHours(UPDATE_TIME.slice(0,2))
update_date.setMinutes(UPDATE_TIME.slice(3,5))
update_date.setSeconds(0)
update_date.setMilliseconds(0)

//Time in milliseconds until the interval should be started
let time_until_daily_update = update_date.getTime() - new Date().getTime()
setTimeout(() => {
  setInterval(update.updateDaily, DAY_INTERVAL)
}, time_until_daily_update
)

update.updateFive();

module.exports = app;
