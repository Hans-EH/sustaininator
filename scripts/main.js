let Device = require('../models/device');
let UserProfile = require('../models/user_profile')
let User = require('../models/user');

/* This function handles all of the updates and is called every five minutes

    It goes through every profile and through every device the profile have, then it:
    1 - updates its state based on the probability it have turning on at current time
    2 - updates the total amount of energy the device have consumed over the last day and its lifetime
    3 - updates the profiles total amount of energy consumed by taking the sum of all the active devices it has

*/
exports.update = function() {
    
    // Get the current local time
    let day = new Date();

    // Format a time string and round down the minutes to nearest five minute interval
    // ex. 00:04 becomes 00:00, 00:06 becomes 00:05
    let hour = day.getHours();
    let minutes = Math.floor(day.getMinutes() / 5);

    // Convert the current local time as an index between 0 and 288
    let time_index = 12 * hour + minutes
    
    UserProfile.find({}).populate('devices').exec(function (err, user_profiles) {
        if (err) {return new Error('User profiles could not be updated!')}
        for (let user_profile of user_profiles) {
            let total_energy_of_active_devices = 0
            for (let device of user_profile.devices) {
                if (shouldActivate(device, time_index)){
                    updateState(device, 'ON')
                    updateDeviceEnergyConsumption(device, 'ON')
                    total_energy_of_active_devices += (device.power / (12 * 1000)) //Convert to KWh
                }
                else {
                    updateState(device, 'OFF')
                    updateDeviceEnergyConsumption(device, 'OFF')
                }
            }
            updateUserProfileEnergyConsumption(user_profile, total_energy_of_active_devices)
        }
    })

}
//Updates the state of a single device
function updateState(device, state) {

    if (state === 'ON') {
        device.state = 'ON'
    }
    else device.state = 'OFF'

    //Save the device
    device.save(function (err) {
        if (err) {return new Error(`${device.name} could not be updated!`)}
    });
}

// Update a single device lifetime and last-day energy consumption
function updateDeviceEnergyConsumption(device, state){

    //Shift the array five-minutes to the left
    device.energy_consumption_last_day.shift();

    if (state === 'ON') {
        device.energy_consumption_last_day.push(device.power / (12 * 1000));
        device.lifetime_energy_consumption += device.power / (12 * 1000);
    }
    else {
        device.energy_consumption_last_day.push(0);
    }

    //Save the device
    device.save(function(err, next) {
        if (err) {return new Error(`${device.name}'s energy consumption could not be updated!`)}
    });
}

// Update a single user profiles energy consumption
function updateUserProfileEnergyConsumption(user_profile, total_energy_of_active_devices){

    // Shift the array five-minutes to the left
    user_profile.total_energy_consumption_last_day.shift()

    // Round and add the energy consumption of all the profiles active devices
    user_profile.total_energy_consumption_last_day.push(Math.round(total_energy_of_active_devices * 100) / 100);

    //Save profile to db
    user_profile.save(function (err, next) {
        if (err) {return new Error(`User profile "${user_profile.firstname} ${user_profile.lastname}" could not be updated!`)}
        //console.log(`User profile "${user_profile.firstname}" was successfully updated!`)
    });
}

/**
 * 
 * @param {*} device A device schema instance of the Device model
 * @param {*} time_index An index of the current time
 * @returns true if a given device at current time have a probablilty higher than a pseudorandom number
 *          false otherwise
 */
function shouldActivate(device, time_index){

    //Get the probability of the device
    prob_of_activating = device.probVector[time_index]

    return  Math.random() < prob_of_activating;
}