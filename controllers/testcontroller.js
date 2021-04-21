// Packages
const { body, validationResult } = require("express-validator");

// Models
let UserProfile = require("../models/user_profile");

// Settings GET request
exports.test_get = function (req, res, next) {
  res.render("test", {
    title: "Test",
    route: "/test",
  });
};

// Settings POST request
exports.test_post = function (req, rest, next) {};
