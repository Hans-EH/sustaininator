const fetch = require("node-fetch");
let AdviceCard = require("../models/advice_card");
const UserProfile = require("../models/user_profile");
const ONE_HOUR = 3600000;
const MAX_ADVICES = 4;
const RECOMMENDATION_GRADE = 1;

//to be removed
let mongoose = require("mongoose");
let mongoDB = "mongodb+srv://jsaad:augaug1@cluster0.g6o9l.mongodb.net/project_skarp?retryWrites=true&w=majority";
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));


/**
 * Function used find out if a card of similar type has been
 * created in the time between now and the ONE_HOUR constant
 * @param {*} grade Recieces the grade of that should be checked
 * @return true if above, false otherwise
 */
async function recentExists(grade) {
    let exists = false;
    await AdviceCard.find({ class: "recommendation", grade: grade })
        .then((advices_arr) => {
            for (let i = 0; i < advices_arr.length; i++) {
                if ((new Date() - advices_arr[i].created) < ONE_HOUR) {
                    exists = true;
                }
            }
        }).catch((err) => {
            console.log(err);
        });
    return exists;
}

/**
 * Function used The pick the right content that should be used
 * in the mongoose model for the AdviceCard, including type and value
 * @param {*} pctIncrease The amount that a value strays from average [Integer]
 * @param {*} type The type of GRADE that the card should be created [0-5]
 * @return true if above, false otherwise
 */
exports.createAdvice = async function createAdvice(information, type) {
    console.log(`entered createAdvice for type: ${type}`);

    let advice_card;
    // Switching advice depending on type
    switch (type) {
        case 1:
            advice_card = new AdviceCard({
                class: "recommendation",
                grade: type,
                title: "We've got a recomendation!",
                message: information
            });
            break;

        default:
            console.log("Incorrect type received by switch");
            break;
    }

    // Save AdviceCard to MongoDB database
    return advice_card.save()
        .then((new_card) => {
            console.log(new_card);
            return new_card;
        })
        .catch((err) => {
            return err;
        });
};

exports.reduceCarbonImpact = async function reduceCarbonImpact(data, UserProfile, carbon_30) {
    try {
        //get sustainable goals from profile data
        let saving_procent = 100-UserProfile.sustainable_goals;
        //copies the data
        let carbon_30_copy = carbon_30.slice();
        carbon_30_copy.sort((a,b)=>{return a-b;});

        //calculating current percentile constant minis -0.01 becasue otherwise saving 0% gives an undefined error.
        let saving_procent_data = carbon_30_copy[(Math.floor(((carbon_30_copy.length / 100)-0.01) * UserProfile.sustainable_goals))];

        //slices so only the forecasted data after the last real datapoint is used.
        let forecast_data = data.forecast_data.slice(data.data.length, data.forecast_data.length);

        //last datapoint, to be copied
        let data_now = data.data[data.data.length-1];
        let output = [];

        //i is 5 minute intervals here
        //finds the soonest timepoint which fulfills criterias: 1. lower than the current data, 2. fulfills your goal.
        for (let i = 0; i < forecast_data.length; i++) {
            if (data_now > forecast_data[i] && forecast_data[i] < saving_procent_data) {
                output.push(i);
                output.push(forecast_data[i]);
                output.push(saving_procent);
                break;
            }
        }
        let recommendation_msg = `If our forecast is right, then if you wait ${(output[0]/12).toFixed(2)} hours until the ${data.forecast_labels[data.data.length+output[0]].slice(0,2)}. at time ${data.forecast_labels[data.data.length+output[0]].slice(4,9)},
         you can save ${((1 - (output[1] / data_now)) * 100).toFixed(0)}% which is equivalent to ${forecast_data[output[0]].toFixed(0)} CO2/KWh, which achieves
           your goal of saving ${output[2]}% compared to the 30 day average`;
        //console.log("output: "+output+" , saving procent: "+saving_procent+"data copy: "+carbon_30_copy.length+"saving procent data "+saving_procent_data);
        console.log(recommendation_msg);

        /* ======= ADVICE CARD CREATION SECTION ====== */
        // Compare current energy prod, with average
        if (output.length !== 0 && output[0] !== 0) { // if a better time has been found, then it shouldnt be 0.
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
//exports.eventCallStack = 
/* async function eventCallStack() {
    // Fetch Energinet.dk - danish energy production data
    const URI =
        'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT "Minutes5DK", "PriceArea", "OffshoreWindPower", "OnshoreWindPower", "SolarPower" FROM "electricityprodex5minrealtime" ORDER BY "Minutes5UTC" DESC LIMIT 4032';
    let data = await fetch(URI).then((response) => response.json());

    console.log("\n== before advice creation ==");

    // *_sc -> should create advice 
    const forecast_sc = await reduceCarbonImpact();

    let forecast_advice = null;
    if (forecast_sc[0] == true) {
        forecast_advice = await createAdvice(forecast_sc[1], RECOMMENDATION_GRADE);
    }

    // Save the users profile after changes
    if (forecast_sc[0] == true) {
        UserProfile.find({}).populate('advices').exec(function (err, user_profiles) {
            console.log("\n== entering saving ==");

            for (let userprofile of user_profiles) {
                reduceCarbonImpact()
                if (forecast_sc[0]) {
                    while (userprofile.advices.length >= MAX_ADVICES) {
                        userprofile.advices.shift();
                    }
                    userprofile.advices.push(forecast_advice);
                }

                userprofile.save(function (err) {
                    if (err) { console.log(`couldn't save user profile \n ${err}`); }
                    else { console.log(`${userprofile.id} saved `); }
                });
            }
        });
    };
}
reduceCarbonImpact(); */