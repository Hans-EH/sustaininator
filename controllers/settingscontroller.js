// Packages
const { body, validationResult } = require("express-validator");
const auth = require("./AuthController");

// Models
let UserProfile = require("../models/user_profile");

// Settings GET request
exports.settings_get = function (req, res, next) {
  if (auth.isAuthenticated(req, res))
    UserProfile.findOne({ user: req.cookies["auth"] }).exec(function (
      err,
      profile_data
    ) {
      if (err) {
        return next(err);
      }

      // render data to settings page
      res.render("settings", {
        title: "Settings",
        route: req.originalUrl,
        profile_data: profile_data,
      });
    });
};

// Settings POST request
exports.user_settings_post = [
  // User input sanitation
  body("FirstNameValue").trim().isAlpha(["da-DK"]),
  body("LastNameValue").trim().isAlpha(["da-DK"]),

  function (req, res, next) {
    console.log("Reached!");
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log(errors.array());
      res.render("settings", { title: "Settings", messages: errors.array() });
    } else {
      // Format user input
      formatFirst = req.body.FirstNameValue;
      formatFirst = formatFirst.replace(/^\w/, (c) => c.toUpperCase());

      formatLast = req.body.LastNameValue;
      formatLast = formatLast.replace(/^\w/, (c) => c.toUpperCase());
      console.log(`first: ${formatFirst} \nlast: ${formatLast}`);

      // Update Database information
      UserProfile.findOneAndUpdate(
        { user: req.cookies["auth"] },
        {
          firstname: formatFirst,
          lastname: formatLast,
          pref_currency: req.body.prefered_currency,
        }
      ).exec(function (err, record) {
        if (err) {
          return next(err);
        } else {
          const messages = [
            {
              msg: "Settings successfully updated.",
              status: true,
            },
          ];

          res.render("settings", {
            title: "Settings",
            test: "tester",
            messages: messages,
          });
        }
      });
    }
  },
];

// Sustainable POST request
exports.sustain_settings_post = [
  body("sustainable_goals").isNumeric(),

  function (req, res, next) {
    console.log("Reached!");
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log(errors.array());
      res.render("settings", { title: "Settings", messages: errors.array() });
    } else {
      console.log(req.body);
      UserProfile.findOneAndUpdate(
        { user: req.cookies["auth"] },
        {
          sustainable_goals: req.body.sustainable_goals,
        }
      ).exec(function (err, record) {
        if (err) {
          return next(err);
        } else {
          console.log("Record updated" + record);

          const messages = [
            {
              msg: "Settings successfully updated.",
              status: true,
            },
          ];

          res.render("settings", { title: "Settings", messages: messages });
        }
      });
    }
  },
];
