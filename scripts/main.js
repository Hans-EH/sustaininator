/* This is the server side update loop */
let async = require('async');
const device = require('../models/device');
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
    updateState()
    sumEnergyCons()
}

//Sum all the energy usages for all users
function sumEnergyCons(){

    //Loop over every Device and update their energy consumption last day field
    Device.find({state: "ON"}).exec((err, device_list) => {
        if (err) {return next(err);}

        //Update the energyusage 
        for (device of device_list) {
            
        }
    });


    //Convert to kWh
    sum = sum / 12 * 1000

    //Queue stack


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
            let state;
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

