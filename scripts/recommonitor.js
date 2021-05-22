const fetch = require("node-fetch");
let AdviceCard = require("../models/advice_card");
const UserProfile = require("../models/user_profile");
const ONE_HOUR = 3600000;
const MAX_ADVICES = 6;
const RECOMMENDATION_GRADE = 1;

/**
 * Function used to pick the right content that should be used
 * in the mongoose model for the AdviceCard, including type and value
 * @param {*} pctIncrease The amount that a value strays from average [Integer]
 * @param {*} type The type of GRADE that the card should be created [0-5]
 * @return true if above, false otherwise
 */
async function createAdvice(information, type) {
  console.log(`entered createAdvice for type: ${type}`);

  let advice_card;
  // Switching advice depending on type
  switch (type) {
    case 1:
      advice_card = new AdviceCard({
        class: "recommendation",
        grade: type,
        title: "We've got a recomendation!",
        message: information,
      });
      break;

    default:
      console.log("Incorrect type received by switch");
      break;
  }

  // Save AdviceCard to MongoDB database
  advice_card.save(function (err) {
    if (err) {
      return new Error("Recommendation card could not be saved!");
    }
    //saved
  });
  //Return advice card back to event call stack to save to profile
  return advice_card;
}

/**
 *
 * @param {*} data Forecast data
 * @param {*} UserProfile Profile instance
 * @param {*} carbon_30 Running average over 30 days data of carbon emissions
 * @returns [true, msg] [false]
 */
function reduceCarbonImpact(data, UserProfile, carbon_30) {
  try {
    //get sustainable goals from profile data
    let saving_procent = 100 - UserProfile.sustainable_goals;
    //copies the data
    let carbon_30_copy = carbon_30.slice();
    carbon_30_copy.sort((a, b) => {
      return a - b;
    });

    //calculating current percentile constant minis -0.01 becasue otherwise saving 0% gives an undefined error.
    let saving_procent_data =
      carbon_30_copy[
        Math.floor(
          (carbon_30_copy.length / 100 - 0.01) * UserProfile.sustainable_goals
        )
      ];

    //slices so only the forecasted data after the last real datapoint is used.
    let forecast_data = data.forecast_data.slice(
      data.data.length,
      data.forecast_data.length
    );

    //last datapoint, to be copied
    let data_now = data.data[data.data.length - 1];
    let output = [];

    //"i" is 5 minute intervals here
    //finds all timepoints which fulfills criterias: 1. lower than the current data, 2. fulfills your sustainability goal.
    for (let i = 1; i < forecast_data.length; i++) {
      let temp_data = [];
      if (
        data_now > forecast_data[i] &&
        forecast_data[i] < saving_procent_data
      ) {
        //how long into the future it is
        temp_data.push(i);
        //the co2 emission at that time
        temp_data.push(forecast_data[i]);
        //sustainability goals
        temp_data.push(saving_procent);
        //how much you save if you wait until this moment
        temp_data.push(((1 - forecast_data[i] / data_now) * 100).toFixed(0));
        //finds which timepoint is the best advice, currently we are going to check on the basis of highest savings as soon as possible
        temp_data.push(temp_data[3]/i);
        //push the tempdata to output:
        output.push(temp_data);
      }
    }

    //finds the best time, and copies it
    let best_time = [0, 0,0,0,0];
    for (let i = 0; i < output.length; i++) {
      if (best_time[4] < output[i][4]) {
        best_time = output[i];
      }
    }
    console.log("best time array:"+best_time);
    //Quick logic to get hours and minutes until good forecast
    let wait_min = best_time[0] * 5;
    let wait_hour = Math.floor(wait_min / 60);
    wait_min = wait_min % 60;
    //Piecing the wait message together
    //Example 80 mins becomes: 1 hour and 20 mins
    let hour_msg =
      wait_hour > 0
        ? wait_hour > 1
          ? `${wait_hour} hours`
          : `${wait_hour} hour`
        : "";
    let and_msg = wait_hour > 0 && wait_min > 0 ? " and " : "";
    let min_msg = wait_min > 0 ? `${wait_min} mins` : "";
    let wait_msg = `${hour_msg}${and_msg}${min_msg}`;

    let recommendation_msg = `If our forecast is right, then if you wait ${wait_msg} until the ${data.forecast_labels[
      data.data.length + best_time[0]
    ].slice(0, 2)}. at time ${data.forecast_labels[
      data.data.length + best_time[0]
    ].slice(4, 9)},
         you can save ${best_time[3]}% which is equivalent to ${forecast_data[
      best_time[0]
    ].toFixed(0)} CO2/KWh, which achieves
           your goal of saving ${UserProfile.sustainable_goals}%`;
    //console.log("output: "+output+" , saving procent: "+saving_procent+"data copy: "+carbon_30_copy.length+"saving procent data "+saving_procent_data);
    console.log(recommendation_msg);

    /* ======== ADVICE CARD CREATION SECTION ====== */
    // Compare current energy prod, with average
    if (best_time.length !== 0 && best_time[0] !== 0) {
      // if a better time has been found, then it shouldnt be 0.
      // Check if any recent solar advices has been created
      return [true, recommendation_msg];
    } else {
      console.log("No forecast advice found");
      return [false];
    }
  } catch (e) {
    console.error(e);
  } finally {
    console.log("--> Reduce Carbon Forecast Executed");
  }
}

/**
 * The main function that is used to call all the child functions
 * in the correct order and save the reuslts of those to MongoDB
 */
exports.eventCallStack = async function eventCallStack(carbon30) {
  //Remove all recommendation cards before creating new ones
  await AdviceCard.deleteMany({ class: "recommendation" });

  //Fetch own api forecasting data
  const URI_FORECAST = process.env.WEB_HOST + "data/forecastdata";
  let forecast_data = await fetch(URI_FORECAST).then((response) =>
    response.json()
  );

  //Save the users profile after changes
  UserProfile.find({})
    .populate("advices")
    .exec(async function (err, user_profiles) {
      console.log("\n== entering saving ==");

      for (let user_profile of user_profiles) {
        //Check if we should create recommendation card for this profile
        let forecast_sc = reduceCarbonImpact(
          forecast_data,
          user_profile,
          carbon30
        );

        if (forecast_sc[0] == true) {
          //Create advice card and save this to user profile
          recommendation_card = await createAdvice(
            forecast_sc[1],
            RECOMMENDATION_GRADE
          );

          //Insert recommendation card into advice queue and shift if MAX advice cards is exceeded

          //Filter out recommendation cards before inserting new ones
          //console.log(`Before Profile: ${user_profile.firstname} | ${user_profile.advices}`)
          user_profile.advices = user_profile.advices.filter(
            (cards) => cards.class != "recommendation"
          );
          //console.log(`After Profile: ${user_profile.firstname} | ${user_profile.advices}`)
          //Insert recommendation card with FIFO method
          if (user_profile.advices.length >= MAX_ADVICES) {
            user_profile.advices.shift();
            user_profile.advices.push(recommendation_card);
          } else {
            user_profile.advices.push(recommendation_card);
          }

          //Save profile changes
          user_profile.save(function (err) {
            if (err) {
              console.log(`couldn't save user profile \n ${err}`);
            }
          });
        }
        //Nothing should be done to profile...
      }
    });
};
//reduceCarbonImpact();
