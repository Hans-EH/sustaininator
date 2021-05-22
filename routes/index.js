var express = require("express");
var router = express.Router();

const UserProfile = require("../models/user_profile");
const device_controller = require("../controllers/devicecontroller");
const settings_controller = require("../controllers/settingscontroller");
const register_controller = require("../controllers/registercontroller");
const login_controller = require("../controllers/logincontroller");
const auth = require("../controllers/authcontroller");
const Device = require("../models/device");
const AdviceCard = require("../models/advice_card");

/* ======= HOMEPAGE ======= */
// GET request for homepage
router.get("/", function (req, res, next) {
  // checking if user is logged in
  if (auth.isAuthenticated(req, res))
    UserProfile.findOne({ user: req.cookies["auth"] }).populate("advices").exec(function (err, profile_data) {
      if (err) { return next(err); }

      // Calcute Time since creation for Cards
      if (profile_data.advices != null) {
        for (advice of profile_data.advices) {
          advice.timeSince = Math.round((new Date() - advice.created) / (60 * 1000));
        }
      }


      //Count the number of devices
      Device.find({ user_profile: profile_data })
        .countDocuments(function (err, counted_devices) {
          if (err) { return next(err); }
          // render data to settings page
          res.render("index", {
            title: "Homepage",
            route: "/",
            profile_data: profile_data,
            counted_devices: counted_devices,
            advices: profile_data.advices.reverse(),
            carbon_data: process.env.WEB_HOST + "data/carbondata",
            forecast_data: process.env.WEB_HOST + "data/forecastdata",
            green_energy: process.env.WEB_HOST + "data/greenenergy",
            time_since_creation: String(profile_data.created).slice(4, 15),
          });
        });
    });
});


// POST request for removing advice cards.
router.post("/remove-advice/:id", function (req, res, next) {
  if (auth.isAuthenticated(req, res))

    // findByIdAndDelete
    UserProfile.findOne({ user: req.cookies["auth"] }).exec(function (err, userprofile) {
      console.log(userprofile.advices);
      userprofile.advices = userprofile.advices.filter(item => item != req.params.id);

      userprofile.save(function (err) {
        if (err) {
          console.log(`couldn't save user profile \n ${err}`);
          res.redirect("/");
        }
        else {
          console.log(`${userprofile.id} saved `);
          res.redirect("/");
        }
      });
    });
});


router.get("/cards", function (req, res, next) {

  let pctIncrease = 20;
  let advices = [
    {
      class: "status",
      grade: 1,
      title: "You're a true climate hero!",
      message: `Very impressive! Your CO2 emissions stayed under your goal over 80% of the time. You either set your goals too low, or you're just THAT good. Now challenge yourself, raise the bar and be the climate hero you were born to be!`,
      timeSince: 2
    },
    {
      class: "status",
      grade: 2,
      title: "You're doing great!",
      message: `Wooow, you have kept your CO2 emissions under your goal more than 60% of the time. You're clearly doing something right. Keep doing that! Maybe share your success with others to inspire them to make the same positive change you have. Keep up the good work buddy!`,
      timeSince: 4
    },
    {
      class: "status",
      grade: 3,
      title: "Keep calm and keep trying!",
      message: `Hang in there! You stayed under your emission goals over 40% of the time. To improve your performance, use energy in periods with low CO2 emmission. Visit us often for advice and see our graphs for the best times to use energy. We have faith in you!`,
      timeSince: 6
    },
    {
      class: "status",
      grade: 4,
      title: "Need a bit of help?",
      message: `Not bad, but not great. Your CO2 emissions were under your goals over 20% of the time. There's room to improve. Ask yourself: "Do I really need hot food? We know cooked rice is great and all, but we're kind of trying to save the environment.`,
      timeSince: 8
    },
    {
      class: "status",
      grade: 5,
      title: "How dare you!",
      message: "Oh, dear. That's not quite what we hoped for, is it? Your CO2 emissions stayed below your goal less than 20% of the time. But what's a bit extra of CO2, really? The sea levels will be fine... Our advice: Consider buying a boat!",
      timeSince: 10
    },
    {
      class: "event",
      grade: 4,
      title: "Low CO2 emissions",
      message: `Yay, CO2 levels are ${pctIncrease}% below average. Now is the time to charge your devices and find excuses for why you can't hoover right now. So plug in that Tesla, blast your favourite music, and bake a cake. It's partytime! With a clean conscience!`,
      timeSince: 2
    },
    {
      class: "event",
      grade: 3,
      title: "Too much CO2!",
      message: `Uh oh, current CO2 levels are ${pctIncrease}% above average. You can help the environment by delaying energy hungry activities. You wouldn't want to be responsible for global warming now, would you? Not that we're logging your information or anything.`,
      timeSince: 2
    },
    {
      class: "event",
      grade: 2,
      title: "It's windy today!",
      message: `Woohooo, hold on to your hats! ${pctIncrease}% increased wind energy production, don't blow your chance to use all that cheap, clean energy. By the way, do you know why wind energy is so cheap? Because the birds already paid the price... well, Enjoy!`,
      timeSince: 2
    },
    {
      class: "event",
      grade: 1,
      title: "The Sun is out!",
      message: `Heyooo, sun's out guns out.. we're seeing ${pctIncrease}% increased solar energy production at the moment, enjoy the clean energy. And probably the great weather, too! Remember to use sunscreen! Unless it's raining... we didn't check for that. Sorry.`,
      timeSince: 4
    },
    {
      class: "recommendation",
      grade: 1,
      title: "We've got an recomendation!",
      message: "If our forecast is right, then if you wait 50 mins until the 19. at time 15:10, you can save 7% which is equivalent to 84 CO2/KWh, which achieves your goal of saving 75%",
      timeSince: 4
    },
  ];

  res.render("cards", { title: "Lol", advices: advices });
})

//GET navbar
router.get("/navbar", function (req, res, next) {
  // checking if user is logged in
  if (auth.isAuthenticated(req, res))
    UserProfile.findOne({ user: req.cookies["auth"] }).exec(function (
      err,
      profile_data
    ) {
      if (err) {
        return next(err);
      }
      // render data to navbar
      res.render("navbar", {
        title: "navbar",
        route: "/navbar",
        profile_data: profile_data,
      });
    });
});

/* ======= DEVICE ======= */

// GET request for device page
router.get("/devices", device_controller.device_list);

// GET request for device detail
router.get("/devices/device_detail/:id", device_controller.device_detail);

// POST request to add a new Device
router.post("/devices", device_controller.device_create_post);

// GET request to edit a device
router.get("/devices/edit/:id", device_controller.device_edit_get);

// POST request to edit a device
router.post("/devices/edit/:id", device_controller.device_edit_post);

// GET request to delete a device
router.get("/devices/delete/:id", device_controller.device_delete_get);

/* ======= SETTINGS ======== */

// GET request for settings page
router.get("/settings", settings_controller.settings_get);

// POST request to make changes in user settings
router.post("/user_settings", settings_controller.user_settings_post);

// POST request to make changes in sustianable settings
router.post("/sustain_settings", settings_controller.sustain_settings_post);

/* ======= USER REGISTER ======= */

// GET request for registration page
router.get("/register", register_controller.register_get);

// POST request to create new user
router.post("/register", register_controller.register_post);

/* ======= USER REGISTER ======= */

// GET request for authentication page
router.get("/login", login_controller.auth_get);

// POST request for authentication page
router.post("/login", login_controller.auth_post);

// GET request for loguout
router.get("/logout", login_controller.auth_logout);

module.exports = router;