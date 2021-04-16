const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
let User = require("../models/user");
let saltRounds = 10; // maybe

exports.auth_get = function (req, res, next) {
  res.render("login", { title: "Login" });
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

      console.log(tried_email);
      console.log(tried_pass);

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
                console.log("email and passsword didn't match.. Try again!");
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
          console.log("The request user haven't been found, want to register?");
          let user_not_found = [
            "The request user haven't been found, want to register?",
          ];
          res.render("login", { title: "Login", messages: user_not_found });
        }
      });
    }
  },
];
