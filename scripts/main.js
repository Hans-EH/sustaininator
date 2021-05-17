const fetch = require("node-fetch");
let Device = require('../models/device'); // unused?
let UserProfile = require('../models/user_profile')
let User = require('../models/user');

// Functions
let eventMonitoring = require("./eventmonitor");
const user_profile = require("../models/user_profile");

/* This function handles all of the updates and is called every five minutes

    It goes through every profile and through every device the profile have, then it:
    1 - updates its state based on the probability it have turning on at current time
    2 - updates the total amount of energy the device have consumed over the last day and its lifetime
    3 - updates the profiles total amount of energy consumed by taking the sum of all the active devices it has
    4 - updates the profiles carbon scores to test wether they are doing good or bad

*/
exports.update = async function () {

    // Get the current local time
    let day = new Date();

    // Format a time string and round down the minutes to nearest five minute interval
    // ex. 00:04 becomes 00:00, 00:06 becomes 00:05
    let hour = day.getHours();
    let minutes = Math.floor(day.getMinutes() / 5);

    // Convert the current local time as an index between 0 and 288
    let time_index = 12 * hour + minutes

    // Get the latest CO2 emissions value from energinet
    let URI_latest = 'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT"Minutes5UTC", "Minutes5DK", "PriceArea", "CO2Emission" FROM "co2emis" ORDER BY "Minutes5UTC" DESC LIMIT 1';
    let latest_carbon_data = await fetch(URI_latest).then((response) => response.json());
    let latest_carbon_value = latest_carbon_data["result"]["records"]["0"]["CO2Emission"];
    // Get the latest 30 days average worth of CO2 datapoints from own api endpoint
    let URI_30_days = process.env.WEB_HOST + "data/carbon30";
    let average_carbon_data = await fetch(URI_30_days).then((response) => response.json());
    average_carbon_data = average_carbon_data["carbon_30"]
    //Sort the avg_carbon_data from low->high to later find the users percentile line
    average_carbon_data.sort((a,b) => a - b);


    // Do the updates
    UserProfile.find({}).populate('devices').exec(function (err, user_profiles) {
        if (err) { return new Error('User profiles could not be updated!') }
        for (let user_profile of user_profiles) {
            let total_energy_of_active_devices = 0
            for (let device of user_profile.devices) {
                if (shouldActivate(device, time_index)) {
                    updateState(device, 'ON')
                    updateDeviceEnergyConsumption(device, 'ON')
                    total_energy_of_active_devices += (device.power / (12 * 1000)) //Convert to KWh
                }
                else {
                    updateState(device, 'OFF')
                    updateDeviceEnergyConsumption(device, 'OFF')
                }
            }
            //Do profile specific things...
            updateUserProfileEnergyConsumption(user_profile, total_energy_of_active_devices);
            updateTotalProfileCarbonEmissions(user_profile, total_energy_of_active_devices, latest_carbon_value)
            updateUserProfileCarbonSavings(user_profile, average_carbon_data, latest_carbon_value, total_energy_of_active_devices);
            updateUserProfileCarbonScoreLastDay(user_profile, average_carbon_data, latest_carbon_value);
            
        }
    });

    // Monitoring for Events
    eventMonitoring.eventCallStack();
}

//Updates the state of a single device
function updateState(device, state) {

    if (state === 'ON') {
        device.state = 'ON'
    }
    else device.state = 'OFF'

    //Save the device
    device.save(function (err) {
        if (err) { return new Error(`${device.name} could not be updated!`) }
    });
}

// Update a single device lifetime and last-day energy consumption
function updateDeviceEnergyConsumption(device, state) {

    //Shift the array five-minutes to the left and if ON push device's energy use in the next 5 minutes in kWh
    // Energy = Power * Time, Example 1: E = 2 W * 1 h = 2 Wh, Example 2: E = 1000 W * 1 h = 1000 Wh = 1 kWh
    // Example 3 (5 minutes): E = 7 W * (1/12) h = (7/12) Wh = (7/12)/1000 kWh = 7/(12 * 1000) kWh
    device.energy_consumption_last_day.shift();

    if (state === 'ON') {
        device.energy_consumption_last_day.push(device.power / (12 * 1000));
        device.lifetime_energy_consumption += device.power / (12 * 1000);
    }
    else {
        device.energy_consumption_last_day.push(0);
    }

    //Save the device
    device.save(function (err, next) {
        if (err) { return new Error(`${device.name}'s energy consumption could not be updated!`) }
    });
}

// Update a single user profiles energy consumption
function updateUserProfileEnergyConsumption(user_profile, total_energy_of_active_devices) {

    // Shift the array five-minutes to the left
    user_profile.total_energy_consumption_last_day.shift();

    // Round and add the energy consumption of all the profiles active devices
    user_profile.total_energy_consumption_last_day.push(Math.round(total_energy_of_active_devices * 100) / 100);

    //Save profile to db
    user_profile.save(function (err) {
        if (err) { return new Error(`User profile "${user_profile.firstname} ${user_profile.lastname}" energy consumption could not be updated!`) }
        //console.log(`User profile "${user_profile.firstname}" was successfully updated!`)
    });
}

function updateTotalProfileCarbonEmissions(user_profile, total_energy_of_active_devices, latest_carbon_value) {
    
    //Convert the carbon footprint to kg instead of grams
    user_profile.carbon_footprint += (total_energy_of_active_devices * latest_carbon_value) / 1000;
    
    user_profile.save(function (err) {
        if (err) {return new Error("Userprofiles total carbon emissions could not be saved")}
        //Got saved
        //console.log("Carbon emissions updated with value: " + total_energy_of_active_devices * latest_carbon_value)
    })

}

//The amount of savings is the difference between the current carbon emissions and the median 
//times the energy currently used
function updateUserProfileCarbonSavings(user_profile, avg_carbon_data, latest_carbon_value, total_energy_of_active_devices) {

    avg_carbon_data.sort((a,b) => a - b);
    //Get median value
    let median = avg_carbon_data[Math.floor(avg_carbon_data.length / 2)];
    // Get the difference in carbon values between current and median
    let difference = median - latest_carbon_value;
    
    //Only add to savings if the difference is positive
    if (difference > 0) {
        user_profile.carbon_saved += (difference * total_energy_of_active_devices) / 1000 //Convert to kg CO2
    }
    console.log("Difference: " + difference + " median: " + median);
    user_profile.save(function (err) {
        if (err) {return new Error("User profiles carbon savings could not be saved!")}
        //Saved
    })
    
}

//Updates a user profiles carbon the score last day if the current carbon emission is lower than their set carbon goal
function updateUserProfileCarbonScoreLastDay(user_profile, avg_carbon_data, cur_carbon_value) {

    //console.log(`${user_profile.firstname}: ${user_profile.sustainable_goals}, type: ${typeof(user_profile.sustainable_goals)}`)
    if (isAboveClimateGoal(user_profile.sustainable_goals, avg_carbon_data, cur_carbon_value)) {
        user_profile.carbon_score_last_day.shift();
        user_profile.carbon_score_last_day.push(true)
    } else {
        user_profile.carbon_score_last_day.shift();
        user_profile.carbon_score_last_day.push(false)
    }
    
    user_profile.save(function (err) {
        if (err) { return new Error(`User profile "${user_profile.firstname} ${user_profile.lastname}" carbon score could not be updated!`) }
        //console.log(`User profile "${user_profile.firstname}" carbon score was successfully updated!`)
    });
}

/**
 * Finds the percentile carbon emissions value in the 30 days average carbon data then compares
 * with the current carbon emission value
 * @param {*} goal 
 * @return true if above, false otherwise
 */
function isAboveClimateGoal(carbon_goal, avg_carbon_data, cur_carbon_value) {
    //Get the latest datapoint on CO2 emissions from energinet
    //Get data from last 30 days of CO2 emissions to calculate percentile savings
    //Calculate if this point is above or below the climate goal
    
    //Get the index in the sorted avg_carbon_data that is the users carbon goal
    //Ex. Carbon Goal = 10%, avg_carbon_data = [1,2,3,4,5,6,7,8,9,10]
    //Output => index 0
    let percentile_index = Math.floor((avg_carbon_data.length / 100) * (100 - carbon_goal))
    //Check if max and in that case lower the index by one to be in range of array
    if (percentile_index === avg_carbon_data.length) {
        percentile_index = avg_carbon_data.length - 1
    }
    //Get the value in avg_carbon_data
    let avg_carbon_value = avg_carbon_data[percentile_index];
    console.log(`carbon_avg: ${avg_carbon_value}`)
    return cur_carbon_value < avg_carbon_value;

}


/**
 * 
 * @param {*} device A device schema instance of the Device model
 * @param {*} time_index An index of the current time
 * @returns true if a given device at current time have a probablilty higher than a pseudorandom number
 *          false otherwise
 */
function shouldActivate(device, time_index) {

    //Get the probability of the device
    prob_of_activating = device.probVector[time_index];
    return Math.random() < prob_of_activating;
}
