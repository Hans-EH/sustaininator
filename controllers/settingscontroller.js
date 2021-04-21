// Packages
const { body, validationResult } = require("express-validator");

// Models
let UserProfile = require("../models/user_profile");

// Settings GET request
exports.settings_get = function (req, res, next) {
  UserProfile.findOne({ user: req.cookies["auth"] }).exec(function (
    err,
    profile_data
  ) {
    if (err) {
      return next(err);
    }

    console.log(profile_data);
    console.log(`first name: ${profile_data.firstname}`);
    // render data to settings page
    res.render("settings", {
      title: "Settings",
      route: "/settings",
      profile_data: profile_data,
    });
  });
};

// Settings POST request
exports.settings_post = function (req, rest, next) {};
