var express = require("express");
var router = express.Router();

let UserProfile = require("../models/user_profile");
let device_controller = require("../controllers/devicecontroller");
let register_controller = require("../controllers/registercontroller");
let login_controller = require("../controllers/logincontroller");
let auth = require("../controllers/AuthController");

// GET home page.
router.get("/", function (req, res, next) {
  // checking if user is logged in
  if (auth.isAuthenticated(req, res))
    // User is logged in
    res.render("index", {
      title: "Express",
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
