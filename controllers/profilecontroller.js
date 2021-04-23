const { body, validationResult } = require("express-validator");

let User = require("../models/user");
let UserProfile = require("../models/user_profile");

exports.user_information_get = function (req, res, next) {
  res.render("login", { title: "Login2", route: req.originalUrl });
};

exports.user_information = function (req, res, next) {
  res.render("login", {
    name: "name",
  });
};
