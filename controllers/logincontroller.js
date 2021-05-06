const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
let User = require("../models/user");
let UserProfile = require("../models/user_profile");
let auth = require("./authcontroller");
const { Mongoose } = require("mongoose");

exports.auth_get = function (req, res, next) {
  res.render("login", { title: "Login", route: "/login" });
};

exports.auth_post = [
  // validation of user input
  body("email").isEmail().normalizeEmail(),
  body("password").trim(),

  function (req, res, next) {
    // save validation errors to objects
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Errors
      console.log(JSON.stringify(errors));
      res.render("login", { title: "Login", messages: errors.array() });
    } else {
      // Form data
      let tried_email = req.body.email;
      let tried_pass = req.body.password;

      User.findOne({ email: tried_email }).exec(function (err, found_user) {
        // Connection or other errors
        if (err) {
          return next(err);
        }

        // If user is found in our database
        if (found_user) {
          bcrypt.compare(
            req.body.password,
            found_user.password,
            (err, result) => {
              if (result) {
                res.cookie("auth", found_user.id, {
                  maxAge: 900000,
                  httpOnly: true,
                });
                res.redirect("/");
              } else {
                let user_bad_match = [
                  "email and passsword didn't match.. Try again!",
                ];
                res.render("login", {
                  title: "Login",
                  messages: user_bad_match,
                });
              }
            }
          );
        }
        // If user is not found in our database
        else {
          let user_not_found = [
            "The requested user hasn't been found, want to register?",
          ];
          res.render("login", { title: "Login", messages: user_not_found });
        }
      });
    }
  },
];

exports.auth_logout = function (req, res, next) {
  console.table(req.cookies);
  if (req.cookies["auth"]) {
    res.clearCookie("auth");
    res.redirect("/login");
  }
};

// Might remove, maybe can be usefull
exports.welcome_get = function (req, res, next) {
  if (auth.isAuthenticated(req, res))
    UserProfile.findOne({ user: req.cookies["auth"] }).exec(function (
      err,
      profile_data
    ) {
      if (err) {
        return next(err);
      }
      // render data to settings page
      res.render("welcome", {
        title: "Welcome to Sustanify",
        name: [profile_data.firstname + " " + profile_data.lastname],
        route: req.originalUrl,
        profile_data: profile_data,
      });
    });
};
