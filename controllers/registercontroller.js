const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

let User = require("../models/user");
let UserProfile = require("../models/user_profile");
let saltRounds = 10;

exports.register_get = function (req, res, next) {
  res.render("register", {
    title: "Register",
    route: req.originalUrl,
  });
};

exports.register_post = [
  // Validate and sanitize form data
  body("email").isEmail().normalizeEmail(),
  body("password").trim().isStrongPassword(),
  // Custom Validation for password matching
  body("password_confirm").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords didn't match");
    } else {
      // Indicates the success of this synchronous custom validator
      return true;
    }
  }),

  function (req, res, next) {
    // save validation errors to objects
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Errors
      res.render("register", { title: "Register", messages: errors.array() });
    } else {
      User.findOne({ email: req.body.email }).exec(function (err, found_user) {
        // Connection or other errors
        if (err) {
          return next(err);
        }

        if (!found_user) {
          bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
            // Create User from Model
            let new_user = new User({
              email: req.body.email,
              password: hash,
            });

            // Create UserProfile from Model
            let user_profile = new UserProfile({
              user: new_user,
              firstname: req.body.firstname,
              lastname: req.body.lastname,
              carbon_saved: 0,
              carbon_footprint: 0,
              sustainable_goals: 0,
            });

            // Save new user
            new_user.save(function (err) {
              if (err) {
                return next(err);
              }

              // If User save is succesfull save Profile
              user_profile.save(function (err) {
                if (err) {
                  return next(err);
                }
                // If Profile Save is succesfull redirect
                res.redirect("/login");
              });
            });
          });
        } else {
          let user_already_exists = [
            {
              msg: `A user with email: ${req.body.email} already exist, want to login?`,
            },
          ];
          res.render("register", {
            title: "register",
            messages: user_already_exists,
          });
        }
      });
    }
  },
];
