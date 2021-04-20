// Packages
const { body, validationResult } = require("express-validator");

// Models
let UserProfile = require("../models/user_profile");

// Settings GET request
exports.settings_get = function (req, res, next) {
  res.render("settings", {
    title: "Settings",
    route: "/settings",
  });
};

// Settings POST request
exports.settings_post = function (req, rest, next) {};
