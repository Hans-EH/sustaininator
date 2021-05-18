const fetch = require("node-fetch");
let AdviceCard = require("../models/advice_card");
const UserProfile = require("../models/user_profile");
const ONE_HOUR = 3600000;
const MAX_ADVICES = 4;
const RECOMMENDATION_GRADE = 1;


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
const createAdvice = async (information, type) => {
    console.log(`entered createAdvice for type: ${type}`);

    let advice_card;
    // Switching advice depending on type
    switch (type) {
        case 1:
            advice_card = new AdviceCard({
                class: "recommendation",
                grade: type,
                title: "We've got an recomendation!",
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


async function reduceCarbonImpact() {
    try {
        //get from profile data
        let saving_procent = 50;
        saving_procent = saving_procent / 100;
        //forecasts data to collect
        let data = [100, 120, 130, 140, 130, 120, 150, 170, 120, 100, 90, 80, 70, 60, 70, 80, 30, 20, 15, 20, 30, 20, 50, 40, 30, 60, 70, 80];
        //last datapoint, to be copied
        let data_now = 100;
        console.log(data);
        //i is hours here
        let output = [];
        for (let i = 0; i < data.length; i++) {
            if (data_now > data[i] && data[i] < (data_now * saving_procent)) {
                output.push(i);
                output.push(data[i]);
                output.push(saving_procent);
                break;
            }
        }
        console.log(`If you wait ${output[0]} hours, you can save ${(1 - (output[1] / data_now)) * 100}% compared to the current carbon footprint per KWh, which achieves your goal of saving ${output[2] * 100}%`);

        /* ======= ADVICE CARD CREATION SECTION ====== */
        // Compare current energy prod, with average
        if (carbon_now >= median) { // change back to greater than
            // Check if any recent solar advices has been created
            if (await recentExists(CARBON_HIGH_GRADE) == false) {
                console.log("Recent Carbon advicecard doesn't exist");
                return [true, recommendation_msg];
            } else {
                console.log("Recent Carbon advicecard exist"); // DEBUGGING
                return [false];
            }
        } else {
            console.log("Carbondioxide too high");
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
exports.eventCallStack = async function eventCallStack() {
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