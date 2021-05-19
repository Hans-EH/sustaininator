const fetch = require("node-fetch");
let UserProfile = require('../models/user_profile')
let AdviceCard = require("../models/advice_card");

// Constants
const CARBON_IMPACT_GRADE = 1;
const MAX_ADVICES = 6;

// Functions
let eventMonitoring = require("./eventmonitor");
let recomendMonitoring = require("./recommonitor");

/* This function handles all of the updates and is called every five minutes

    It goes through every profile and through every device the profile have, then it:
    1 - updates its state based on the probability it have turning on at current time
    2 - updates the total amount of energy the device have consumed over the last day and its lifetime
    3 - updates the profiles total amount of energy consumed by taking the sum of all the active devices it has
    4 - updates the profiles carbon scores to test wether they are doing good or bad

*/
exports.updateFive = async function () {

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
    average_carbon_data.sort((a, b) => a - b);

    // Do the updates
    UserProfile.find({}).populate('devices').populate('advices').exec(function (err, user_profiles) {
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
            updateUserProfileCarbonLastDay(user_profile, latest_carbon_value, total_energy_of_active_devices);


        }
    });

    /**
     * 1 - Find all userprofiles
     * 2 - fetch forecast data
     * 3 - for each userprofile:
     *      - call reduce carbon impact.. <--- Function recomonitor
     *      - createAdviceCard()        <----- Function recomonitor.
     *      - push til advices array <-- hardcoded
     *      - save userprofile. <------- hardcoded
     */

    // Monitoring for recommendations
    await recomendMonitoring.eventCallStack(average_carbon_data);

    // Monitoring for Events
    await eventMonitoring.eventCallStack();

    // Monitoring for Recommendation
    //recomendationMonitoring.eventCallStack();
}

// === Update functions ===

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
        if (err) { return new Error("Userprofiles total carbon emissions could not be saved") }
        //Got saved
        //console.log("Carbon emissions updated with value: " + total_energy_of_active_devices * latest_carbon_value)
    })

}

//The amount of savings is the difference between the current carbon emissions and the median 
//times the energy currently used
function updateUserProfileCarbonSavings(user_profile, avg_carbon_data, latest_carbon_value, total_energy_of_active_devices) {

    avg_carbon_data.sort((a, b) => a - b);
    //Get median value
    let median = avg_carbon_data[Math.floor(avg_carbon_data.length / 2)];
    // Get the difference in carbon values between current and median
    let difference = median - latest_carbon_value;

    //Only add to savings if the difference is positive
    if (difference > 0) {
        user_profile.carbon_saved += (difference * total_energy_of_active_devices) / 1000 //Convert to kg CO2
    }
    //console.log("Difference: " + difference + " median: " + median);
    user_profile.save(function (err) {
        if (err) { return new Error("User profiles carbon savings could not be saved!") }
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

//Updates the profiles carbon emissions the last day by inserting a single datapoint to queue
function updateUserProfileCarbonLastDay(user_profile, latest_carbon_value, total_energy_of_active_devices) {

    let curr_carbon_emission = latest_carbon_value * total_energy_of_active_devices;
    //Insert co2 datapoint into queue
    user_profile.carbon_emission_last_day.shift();
    user_profile.carbon_emission_last_day.push(curr_carbon_emission);

    user_profile.save(function (err) {
        if (err) { return new Error(`User profile "${user_profile.firstname} ${user_profile.lastname}" co2 emissions could not be updated`) }
        //Saved
    });
}
// === Helper functions ===

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

/* This function handles all of the daily updates

    1. Creates a status card based on the last days report
    2. Aggregates data into a weekly report
*/
exports.updateDaily = async function () {

    //Cleanses all status cards before creation
    AdviceCard.deleteMany({ class: 'status' }).exec((err) => {
        if (err) { return new Error("Status cards could not be deleted") }
        //else {console.log("Latest status cards deleted")}
    });

    UserProfile.find({}).populate('advices').exec(function (err, user_profiles) {
        if (err) { return new Error("Could not find any profiles in daily update") }
        for (user_profile of user_profiles) {

            //Do daily profile stuff...
            updateUserProfileCarbonLastWeek(user_profile);
            updateUserProfileStatusCard(user_profile);
        }
    })
}

//Updates a profiles status card by deleting last status card and creating new one
function updateUserProfileStatusCard(user_profile) {

    // The status is calculated as the following:
    // Count number of times the user have been above set climate goal (blackline)
    // Take the positive occurences over total number of occurences to get a percentage
    // Make a scale from 0%..20%..100% to condition on
    // Create the correct status card from this
    // Save the status card on the user profile

    let above_line_count = 0;
    for (let i = 0; i < user_profile.carbon_score_last_day.length; i++) {
        if (user_profile.carbon_score_last_day[i]) {
            above_line_count++;
        }
    }

    let above_line_percentage = above_line_count / user_profile.carbon_score_last_day.length

    let grade = -1;
    if (above_line_percentage <= 100 && above_line_percentage > 80) {
        grade = 1
        // Excellent status card
    }
    else if (above_line_percentage <= 80 && above_line_percentage > 60) {
        grade = 2
        // Good status card
    }
    else if (above_line_percentage <= 60 && above_line_percentage > 40) {
        grade = 3
        // Fine status card
    }
    else if (above_line_percentage <= 40 && above_line_percentage > 20) {
        grade = 4
        // Ok status card
    }
    else if (above_line_percentage <= 20) {
        grade = 5
        // Could do better card
    }

    //Handles deletion of status card on user profile
    eventMonitoring.deleteStatusCard(user_profile);
    //Handles creation of status card on user profile
    eventMonitoring.createStatusCard(grade, user_profile);

}

//Creates a datapoint that is the sum of the past day
function updateUserProfileCarbonLastWeek(user_profile) { //TODO test if it works

    //Sum the profiles carbon emission
    let daily_carbon_emission = user_profile.carbon_emission_last_day.reduce((sum, next) => { return sum + next });

    //Insert into weekly queue
    user_profile.carbon_emission_last_week.shift();
    user_profile.carbon_emission_last_week.push(daily_carbon_emission);

    //Save
    user_profile.save(function (err) {
        if (err) { return new Error(`${user_profile.firstname} failed to save weekly carbon data!`) }
    })
}