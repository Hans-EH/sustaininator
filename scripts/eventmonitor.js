const fetch = require("node-fetch");
var mongoose = require("mongoose");
let AdviceCard = require("../models/advice_card");
const UserProfile = require("../models/user_profile");
const ONE_HOUR = 3600000;
const SOLAR_GRADE = 1;
const WIND_GRADE = 2;

let mongoDB = "mongodb+srv://jsaad:augaug1@cluster0.g6o9l.mongodb.net/project_skarp?retryWrites=true&w=majority";
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Check if any event type has been create since one hour - Virker
function recentExists(grade) {
    AdviceCard.find({ class: "event", grade: grade }).exec(function (err, advices_arr) {
        let exists = false;
        advices_arr.forEach((advice) => {
            if ((new Date() - advice.created) < ONE_HOUR) {
                exist = true;
            }
        });

        return exists;
    });
}

// Function used to create and save advice to db and each user
const createAdvice = async (pctIncrease, type) => {
    console.log(`entered createAdvice for type: ${type}`);

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
    return advice_card.save()
        .then((new_card) => {
            console.log("On save\n");
            console.log(new_card);
            return new_card;
        })
        .catch((err) => {
            return err;
        });
};


async function monitorSolar(data) {
    try {

        console.log("\n == SOLAR MONITOR ==");
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

        console.log(`---> Solar Current: ${dataSolar[0]} - Average: ${average}`);

        /* ======= ADVICE CARD CREATION SECTION ====== */

        // Compare current energy prod, with average
        if (dataSolar[0] >= average) { // change back to greater than
            // Check if any recent solar advices has been created
            if (recentExists(SOLAR_GRADE)) {
                console.log("Recent Solar advicecard doesn't exists");
                return [true, pctIncrease];
            } else {
                console.log("Recent Solar advicecard exists"); // DEBUGGING
                return [false, pctIncrease];
            }
        } else {
            console.log("No card needed");
            return false;
        }
    } catch (e) {
        console.error(e);
    } finally {
        console.log("--> monitorSolar Executed");
    }
};


async function monitorWind(data) {
    try {

        console.log("\n == WIND MONITOR ==");
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

        // Find percentage difference average to current
        let pctIncrease = Math.floor((dataWind[0] / average) * 100 - 100);

        console.log(`Current: ${dataWind[0]} - Average: ${average}`);

        /* ======= ADVICE CARD CREATION SECTION ====== */

        if (dataWind[0] >= average) { // remember to flip sign to >= for actual use case
            if (recentExists(WIND_GRADE)) {
                console.log("Recent Wind advicecard doesn't exists");
                //createAdvice(pctIncrease, WIND_GRADE);
                return [true, pctIncrease];
            } else {
                console.log("Recent Wind advicecard exists"); // DEBUGGING
                return [false, pctIncrease];
            }
        } else {
            console.log("Wind not blowing enough");
            return [false, pctIncrease];
        }
    } catch (error) {
        console.error(error);
    } finally {
        console.log("--> MonitorWind Executed");
    }
};


async function eventCallStack() {
    const URI =
        'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT "Minutes5DK", "PriceArea", "OffshoreWindPower", "OnshoreWindPower", "SolarPower" FROM "electricityprodex5minrealtime" ORDER BY "Minutes5UTC" DESC LIMIT 4032';
    let data = await fetch(URI).then((response) => response.json());

    console.log("\n== before advice creation ==");

    const solar_sc = await monitorSolar(data);
    const wind_sc = await monitorWind(data);
    //const co2_sc = await monitorCO2emission(data);

    //console.log(solar_sc);
    //console.log(wind_sc);

    let solar_advice = null;
    if (solar_sc[0]) {
        solar_advice = await createAdvice(solar_sc[1], SOLAR_GRADE);
    }

    let wind_advice = null;
    if (wind_sc[0]) {
        wind_advice = await createAdvice(wind_sc[1], WIND_GRADE);
    }


    // Save the users profile after changes
    if (solar_sc[0] == true || wind_sc[0] == true) {
        UserProfile.find({}).populate('advices').exec(function (err, user_profiles) {
            console.log("\n== entering saving ==");

            for (let userprofile of user_profiles) {

                if (solar_sc[0]) {
                    while (userprofile.advices.length >= 10) {
                        userprofile.advices.shift();
                    }
                    userprofile.advices.push(solar_advice);
                }


                if (wind_sc[0]) {
                    while (userprofile.advices.length >= 10) {
                        userprofile.advices.shift();
                    }
                    userprofile.advices.push(wind_advice);
                }

                userprofile.save(function (err) {
                    if (err) {
                        console.log(`couldn't save user profile \n ${err}`);
                    } else {
                        console.log(`${userprofile.id} saved `);
                    }
                });
            }
        });
    };
}

// Ligger i update loop
eventCallStack()
