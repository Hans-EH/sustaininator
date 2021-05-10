let User = require("../models/user"); // unused?

exports.isAuthenticated = function (req, res) {
  if (req.cookies["auth"]) {
    return true;
  } else {
    res.redirect("/login");
  }
};
