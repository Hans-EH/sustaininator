var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var nunjucks = require("nunjucks");
var mongoose = require('mongoose');
let { update } = require('./scripts/main.js');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();


//Set up mongoose connection
let mongoDB = 'mongodb+srv://jsaad:augaug1@cluster0.g6o9l.mongodb.net/project_skarp?retryWrites=true&w=majority';
mongoose.connect(mongoDB, { useNewUrlParser: true , useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
nunjucks.configure("views", {
  express: app,
  autoescape: true,
});
app.set("view engine", "html");

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter); // auth routes
app.use('/users', usersRouter); // unauth routes 

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Initiate the loop
const interval = 5 * 60 * 1000 // 5min
setInterval(update, 5000);

module.exports = app;
