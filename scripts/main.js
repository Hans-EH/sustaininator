/* This is the server side update loop */
let async = require('async');
let Device = require('../models/device');
let UserProfile = require('../models/user_profile')
let User = require('../models/user');

//This function handles all of the updates every five minutes
exports.update = function() {
    // 1 - Collect a list of all devices
    // 2 - Calculate a list of all the devices that should be on
    // 3 - Update the status
    // 3.5 - Sum all the devices power consumption
    // 4 - Save the results to the database

    //updateState()
    //updateDeviceEnergyConsumption()
    //updateUserProfileEnergyConsumption()
}

/* loop over all devices with state: "ON"
   update the last day's energy use array
   update the device's total energy use */
function updateDeviceEnergyConsumption(){

    Device.find({state: "ON"}).exec((err, device_list) => {
        if (err) {return next(err);}

        //Update the energyusage 
        for (let device of device_list) {
            device.energy_consumption_last_day.shift();
            device.energy_consumption_last_day.push(device.power / (12 * 1000));

            device.lifetime_energy_consumption += device.power / (12 * 1000);

            //Save
            device.save(function(err, next) {
                if (err) {return next(err)}
            });
        }
    });
}

// loop over all/a user profiles update their last day's energy use array -
// - by looping over all of their devices -> user profile needs a device list
// update each user profile's total energy use
function updateUserProfileEnergyConsumption(){

    UserProfile.find().exec((err, user_profiles) => {
        if (err) {return next(err);}
        if (user_profiles) {
            for (let user_profile of user_profiles) {
                let profile_sum = 0;
                for (let device_id of user_profile.devices) {
                    Device.find({id: device_id, state: "ON"}).exec((err, found_device) => {
                        if (err) {return next(err);}
                        if (found_device) {
                            profile_sum += device.power / (12 * 1000)
                        }
                    });
                    
                }
                //The sum of all the devices energy usage is now summed - add it to the profile
                user_profile.total_energy_consumption_last_day.shift()
                user_profile.total_energy_consumption_last_day.push(profile_sum);

                //Save to db
                user_profile.save(function (err, next) {
                    if (err) {return next(err)}
                });
            }
        }
        else {
            console.log("No profiles is added")
        }
    })
}

//Updates all the states in the database
function updateState() {
    let day = new Date();
    //Format a time string and round down the minutes to nearest five minute interval
    //ex. 00:04 becomes 00:00, 00:06 becomes 00:05
    let hour = day.getHours();
    let minutes = Math.floor(day.getMinutes() / 5);

    //Get the index in the probVector of current time
    let index = 12 * hour + minutes

    //Find all devices and update their state if they should be activated
    Device.find().exec((err, device_list) => {
        if (err) {return next(err)};
        for (let device of device_list) {
            if (shouldActivate(device.probVector[index])) {
                device.state = "ON";
                console.log(`${device.name} should be activated!, with prob ${device.probVector[index]}`)
            } 
            else {device.state = "OFF";}

            //Save the device
            device.save(function(err, next) {
                if (err) {return next(err)}
            })
        }
    })
}

function shouldActivate(p){
    return  Math.random() < p;
}

