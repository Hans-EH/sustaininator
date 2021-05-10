let Device = require("../models/device");
const { body, validationResult } = require("express-validator");
let async = require("async");
let User = require("../models/user");
let UserProfile = require("../models/user_profile");
const { listenerCount } = require("../models/device");
let auth = require('../controllers/authcontroller');

/* Display a list of all devices */
exports.device_list = function (req, res, next) { 
  // checking if user is logged in, else redirect to login screen
  if (auth.isAuthenticated(req, res))
  //Find all devices that links to the user
  UserProfile.find({user: req.cookies["auth"]}).exec(function (err, found_profile) {
    if (err) {return next(err);}
    Device.find({user_profile: found_profile}).exec((err, device_list) => {
      if (err) {return next(err); }
        //Success
        res.render("devices", {
        title: "Device List",
        route: req.originalUrl,
        device_list: device_list,
    });
    })
  });
};

// Display detail page for a specific device.
exports.device_detail = function (req, res, next) {
  if (auth.isAuthenticated(req, res))
  async.parallel(
    {
      device: function (callback) {
        Device.findById(req.params.id).exec(callback);
      },
    },
    function (err, results) {
      if (err) {return next(err);}
      if (results.device == null) {
        // No results.
        let err = new Error("device not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("device_detail", {
        title: results.device.name,
        device: results.device,
      });
    }
  );
};

/* Create Device from form */
exports.device_create_post = [
  // Validate and santise the name field.
  body("devicename")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Device name must be specified"),
  body("energyusage")
    .trim()
    .isNumeric()
    .withMessage("Power consumption must be a number"),

  // Process request after validation and sanitization.
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("devices", {
        title: "Add Device",
        device: req.body,
        errors: errors.array(),
      });
      return;
    } else {
      
      //Find the current user that is logged in
      UserProfile.findOne({user: req.cookies["auth"]}).exec(function (err, found_profile) {
        if (err) {
          return next(err);
        }
        if (found_profile) {
          //Userprofile found - Create a device linking to this userprofile

          //Create new device instance with request inputs
          let device = new Device({
            user_profile: found_profile._id,
            name: req.body.devicename,
            power: req.body.energyusage,
            activetime: req.body.activeArr.split(',').map((val) => Number(val)),
          });
          // Data from form is valid.
          // Check if Device with same name already exists.
          Device.findOne({ name: req.body.devicename }).exec(function (err,found_device) {
            if (err) {return next(err);}
            if (found_device) {
              // Device exists, redirect to its detail page.
              res.redirect("/devices/device_detail/" + found_device._id);
            } else {
              //Device does not exist - Add it to the db and push this device ID to the users profile
              device.save(function (err) {
                if (err) {return next(err);}
              });

              found_profile.devices.push(device._id)

              //Save
              found_profile.save(function (err){
                if (err) {return next(err); }
              });

              res.redirect("/devices");

            }
          });
        } else {
          //The userprofile could not be found -
          res.render("devices", { errors: "User profile could not be found!" });
        }
      });
    }
  },
];

/* Display edit update page */
exports.device_edit_get = function (req, res, next) {
  async.parallel(
    {
      device: function (callback) {
        Device.findById(req.params.id).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.device == null) {
        let err = new Error("Device not found!");
        err.status = 404;
        return next(err);
      }

      //Render the page with already written information on the device
      res.render("device_edit", {
        title: "Edit device",
        device: results.device,
      });
    }
  );
};

/* Handle editting of a device on POST */
exports.device_edit_post = [
  //Validate the fields
  body("devicename")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Device name must be specified"),
  body("energyusage")
    .trim()
    .isNumeric()
    .withMessage("Power consumption must be a number"),

  //Process request
  (req, res, next) => {
    //Get the errors from validation
    const errors = validationResult(req);

    //Format the activetimes of the request
    req.body.activeArr = req.body.activeArr.split(',').map((val) => Number(val));

    //Check if any errors
    if (!errors.isEmpty()) {
      res.render("device_edit", {
        title: "Edit device",
        device: req.body,
        errors: errors.array(),
      });
    } else {
      // Find the current device being editted
      Device.findById(req.params.id).exec(function (err,cur_device) {
        if (err) {return next(err);}
        if (cur_device) {
          
          //Find the device with the name of the request
          Device.findOne({name: req.body.devicename}).exec(function (err, found_device) {
            if (err) {return next(err); }
            if (found_device === null) {
              //Name did change and is not taken - Create new device with old id and new information
              let device = {
                _id: req.params.id,
                name: req.body.devicename,
                power: req.body.energyusage,
                activetime: req.body.activeArr,
              };
              //Find and update the device
              Device.findByIdAndUpdate(req.params.id, device, {setDefaultsOnInsert: false}, function (err) {
                if (err) {return next(err);}
                //Successfully updated device - redirect back to device list page
                res.redirect("/devices");
              });
            }
            else if (found_device.name !== cur_device.name) {
              //Check if the name is already taken
              if (found_device.name === req.body.devicename) {
                //The name was already taken - send back a name already taken msg
                res.render("device_edit", {
                  title: "Edit device",
                  device: cur_device,
                  name_taken: true
                });
              }
            }
            //Name did not change - Check if there was any change to the input
            else if (found_device.power == req.body.energyusage && JSON.stringify(found_device.activetime) == JSON.stringify(req.body.activeArr)) {
              /* Nothings was updated in the form
              - Send back the form and display a no modification msg 
              */
              console.log("Nothing changed!")
              
              //Render the edit page with an additional no_modification keyword
              res.render("device_edit", {
                title: "Edit device",
                device: cur_device,
                no_modification: true,
              });
            }
            else {
              //Name did not change, but new information was given - Update this device with new information
              let device = {
                _id: req.params.id,
                power: req.body.energyusage,
                activetime: req.body.activeArr,
              };
              //Find and update the device
              Device.findByIdAndUpdate(req.params.id, device, {setDefaultsOnInsert: false}, function (err) {
                if (err) {return next(err);}
                //Success - redirect back to device list page
                res.redirect("/devices");
              });
            }
          } 
        )}
      });
    }
  },
];

/* Handle deletion of a device */
exports.device_delete_get = function (req, res, next) {
  //Find and delete the device
  Device.findByIdAndDelete(req.params.id, {}, function (err) {
    if (err) {
      return next(err);
    }
    //Redirect back to same page for a refresh
    res.redirect("/devices");
  });
};
