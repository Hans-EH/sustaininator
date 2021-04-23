let Device = require("../models/device");
const { body, validationResult } = require("express-validator");
let async = require("async");
let { activeProbability } = require("../scripts/active_probability");
let User = require("../models/user");
let UserProfile = require("../models/user_profile");

/* Display a list of all devices */
exports.device_list = function (req, res, next) {
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
        // No results.
        var err = new Error("device not found");
        err.status = 404;
        return next(err);
      }
      console.log("activetime:" + typeof results.device.activetime);
      let probVector = activeProbability(results.device.activetime);
      console.log(probVector);

      // Successful, so render.
      res.render("device_detail", {
        title: results.device.title,
        device: results.device,
        probVector: probVector,
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
    .withMessage("Device name must be specified")
    .isAlphanumeric()
    .withMessage("You can not use non-alphanumeric characters"),
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
          //Format the activetimes from string "1,0,1,...1" to array [1,0,1,...,1]
          let activeArr = req.body.activeArr
            .split(",")
            .map((val) => Number(val));

          //Create new device instance with request inputs

          let device = new Device({
            user_profile: found_profile._id,
            name: req.body.devicename,
            power: req.body.energyusage,
            activetime: activeArr,
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
    .withMessage("Device name must be specified")
    .isAlphanumeric()
    .withMessage("You can not use non-alphanumeric characters"),
  body("energyusage")
    .trim()
    .isNumeric()
    .withMessage("Power consumption must be a number"),

  //Process request
  (req, res, next) => {
    //Get the errors from validation
    const errors = validationResult(req);

    //Check if any errors
    if (!errors.isEmpty()) {
      res.render("device_edit", {
        title: "Edit device",
        device: req.body,
        errors: errors.array(),
      });
    } else {
      // Check if the name tried to be editted already exist
      Device.findOne({ name: req.body.devicename }).exec(function (
        err,
        found_device
      ) {
        if (err) {
          return next(err);
        }
        if (found_device) {
          /* Device name already exists! 
                       - Check if the power consumption and activetime on the found device matches the found device
                    */
          if (found_device.power == req.body.energyusage) {
            /* Nothings was updated in the form
                           - Send back the form and display a name taken msg 
                        */

            //Find the current device in the db to send back with an error message
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

                //Render the edit page with an additional name_taken keyword
                res.render("device_edit", {
                  title: "Edit device",
                  device: results.device,
                  name_taken: true,
                });
              }
            );
          } else {
            /* The name was taken but the power consumption or activetimes has changed 
                           - Create new device with old id and new power consumption and activetimes 
                        */
            let device = new Device({
              power: req.body.energyusage,
              //NOT IMPLEMENTED activetime update
              _id: req.params.id,
            });
            //Find and update the device
            Device.findByIdAndUpdate(req.params.id, device, {}, function (err) {
              if (err) {
                return next(err);
              }
              //Success - redirect back to device list page
              res.redirect("/devices");
            });
          }
        } else {
          /* The name was not taken 
                       - Create new device with old id and new information
                    */
          let device = new Device({
            name: req.body.devicename,
            power: req.body.energyusage,
            //NOT IMPLEMENTED activetime update
            _id: req.params.id,
          });
          //Find and update the device
          Device.findByIdAndUpdate(req.params.id, device, {}, function (err) {
            if (err) {
              return next(err);
            }
            //Success - redirect back to device list page
            res.redirect("/devices");
          });
        }
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
