const fetch = require("node-fetch");
var mongoose = require("mongoose");
let AdviceCard = require("../models/advice_card");
const UserProfile = require("../models/user_profile");
const ONE_HOUR = 3600000;

let mongoDB = "mongodb+srv://jsaad:augaug1@cluster0.g6o9l.mongodb.net/project_skarp?retryWrites=true&w=majority";
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
console.log("connected");

// Check if any event type has been create since one hour
function recentExists(grade) {
    AdviceCard.find({ class: "event", grade: grade }).exec(function (err, advices_arr) {
        console.log("grade is ", grade);
        advices_arr.forEach((advice) => {
            if ((new Date() - advice.created) < ONE_HOUR) {
                console.log("advicing");
                return true;
            }
            else {
                console.log("time was less than 1 hour");
                return false;
            }
        })
    });
}

// Function used to create and save advice to db and each user
const createAdvice = (pctIncrease, type) => {
    console.log("entered createAdvice");
    let advice_card;
    // Switching advice depending on type
    switch (type) {
        case 1:
            advice_card = new AdviceCard({
                class: "event",
                grade: type,
                title: "The Sun is out!",
                message: `Heyooo, sun's out guns out.. ${pctIncrease}% increased solar energy production at the moment, enjoy the clean energy`
            })
            break;

        case 2:
            advice_card = new AdviceCard({
                class: "event",
                grade: type,
                title: "It's windy today!",
                message: `Woohooo, hold on to your hats! ${pctIncrease}% increased wind energy production at the moment, don't blow your chance to use all that clean energy`
            })
            break;

        case 3:
            advice_card = new AdviceCard({
                class: "event",
                grade: type,
                title: "Too much CO2!",
                message: `Uh oh, CO2 levels are.. ${pctIncrease}% above average at the moment, you can help the environment by delaying energy hungry activities`
            })
            break;

        default:
            console.log("Incorrect type received by switch");
            break;
    }

    // Save AdviceCard to MongoDB database
    advice_card.save(function (err) {
        if (err) {
            console.log("couldn't save advice");
        } else {

            // Find all users userprofile and populate advices with documents instead of IDs
            UserProfile.find({}).populate('advices').exec(function (err, user_profiles) {
                console.log("user_profiles has length ", user_profiles.length);
                //console.log(user_profiles);

                // Iterate over all found user_profiles
                for (let userprofile of user_profiles) {

                    // Check if a usersprofile contains 10 or more advices 
                    if (userprofile.advices.length >= 10) {

                        // Delete the oldest entry in userprofile.advices
                        //while (userprofile.advices.length >= 10) {
                        userprofile.advices.shift();
                        //}
                    }

                    // Push new AdviceCard Document to user advices array
                    userprofile.advices.push(advice_card.id);

                    // Save the users profile after changes
                    userprofile.save(function (err) {
                        if (err) {
                            console.log(`couldn't save user profile for grade: ${type}\n ${err}`);
                        } else {
                            console.log(`${userprofile.id} saved - grade : ${type} `);
                        }
                    });
                }
                console.log('out of userprofile for-loop seemingly before saving is done');
            });
        }
    });
};


async function monitorSolar(data) {
    try {
        // Fetch URI for solar data for 1 week
        const URI =
            'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT "Minutes5DK", "SolarPower" FROM "electricityprodex5minrealtime" ORDER BY "Minutes5UTC" DESC LIMIT 4032';
        //'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT "Minutes5DK", "PriceArea", "OffshoreWindPower", "OnshoreWindPower", "SolarPower" FROM "electricityprodex5minrealtime" ORDER BY "Minutes5UTC" DESC LIMIT 4032';
        //let d = ;
        console.time('solarFetch');
        let data = await fetch(URI).then((response) => response.json());
        //d = Date.now();
        console.timeEnd('solarFetch');

        // Create raw data arrays
        let dataTimestamp = [];
        let dataSolar = [];

        // Find sum of DK1 and DK2 and push to arrays
        for (let i = 0; i < data.result.records.length; i = i + 2) {
            dataTimestamp.push(data.result.records[i].Minutes5DK.slice(-8, -6));
            dataSolar.push(data.result.records[i].SolarPower + data.result.records[i + 1].SolarPower);
        }

        // Create daytime solar energy array
        let dayTimeSolar = [];

        // parseInt = "13" -> 13
        // Push solar data points to array is timestamp is between 21:00 -> 05:00
        for (let j = 0; j < dataTimestamp.length; j++) {
            if (parseInt(dataTimestamp[j]) > 05 && parseInt(dataTimestamp[j]) < 21) {
                dayTimeSolar.push(dataSolar[j]);
                //console.log(`${dataTimestamp[j]} -> Solar: ${dataSolar[j]}`); // TEST
            }
        }

        // Sum all daytime solar data points
        let sum = 0;
        dayTimeSolar.forEach(dataPoint => {
            sum += dataPoint
        });

        // Find Average of daytime solar datapoints
        let average = sum / dayTimeSolar.length;

        // Calculate percentage difference average to current
        let pctIncrease = Math.floor((dataSolar[0] / average) * 100 - 100);

        /* ======= ADVICE CARD CREATION SECTION ====== */

        const SOLAR_GRADE = 1;

        // Compare current energy prod, with average
        if (dataSolar[0] <= average) { // change back to greater than
            // Check if any recent solar advices has been created
            if (!recentExists(SOLAR_GRADE)) {
                console.log("Recent Solar advicecard doesn't exists");
                createAdvice(pctIncrease, SOLAR_GRADE);
            }
        } else {
            console.log("No card needed");
        }
    } catch (e) {
        console.error(e);
    } finally {
        console.log("monitorSolar Executed");
    }
    console.log("how did we get here so soon?");
};


async function monitorWind(data) {
    try {
        // Fetch URI for wind data for 1 week
        const URI =
            'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT "Minutes5DK", "OffshoreWindPower", "OnshoreWindPower", "SolarPower" FROM "electricityprodex5minrealtime" ORDER BY "Minutes5UTC" DESC LIMIT 4032';
        let data = await fetch(URI).then((response) => response.json());

        // Create raw data arrays
        //let dataTimestamp = [];
        let dataWind = [];

        let records = data.result.records;
        let totalWindDK1, totalWindDK2;
        // Find sum of DK1 and DK2 and push to array
        for (let i = 0; i < records.length; i = i + 2) {
            totalWindDK1 = records[i].OffshoreWindPower + records[i].OnshoreWindPower;
            totalWindDK2 = records[i + 1].OffshoreWindPower + records[i + 1].OnshoreWindPower;
            dataWind.push(totalWindDK1 + totalWindDK2);
        }

        // Sum all wind data points
        let sum = 0;
        dataWind.forEach(dataPoint => {
            sum += dataPoint;
        })

        // Find average of wind datapoints
        let average = sum / dataWind.length;

        console.log(`Average wind: ${average}`); // DEBUGGING 

        // Find percentage difference average to current
        let pctIncrease = Math.floor((dataWind[0] / average) * 100 - 100);

        /* ======= ADVICE CARD CREATION SECTION ====== */
        const WIND_GRADE = 2;

        if (dataWind[0] <= average) { // remember to flip sign to >= for actual use case
            if (!recentExists(WIND_GRADE)) {
                console.log("current wind: " + dataWind[0]);
                console.log("Recent wind advicecard existsn't, let's make one");
                createAdvice(pctIncrease, WIND_GRADE);
            }
        } else {
            console.log("Wind not blowing enough");
        }

    } catch (error) {
        console.error(error);
    } finally {
        console.log("Function Executed");
    }
};


// Ligger i update loop
monitorSolar();
monitorWind();