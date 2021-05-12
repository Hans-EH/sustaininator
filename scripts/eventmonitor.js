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
        advices_arr.forEach((advice) => {
            if ((new Date() - advice.created) < ONE_HOUR) {
                return true;
            }
        })
    });
}

// Function used to create and save advice to db and each user
const createAdvice = (pctIncrease, type) => {
    console.log("entered");
    let advice_card;
    // Switching advice depeding on type
    switch (type) {
        case 1:
            advice_card = new AdviceCard({
                class: "event",
                grade: type,
                title: "The Sun is out!",
                message: `Heyooo, suns out guns out.. ${pctIncrease}% increased solar enery production at the moment, enjou the clean energy`
            })
            break;

        case 2:
            advice_card = new AdviceCard({
                class: "event",
                grade: type,
                title: "It's windy today !",
                message: `Heyooo, suns out guns out.. ${pctIncrease}% increased solar enery production at the moment, enjou the clean energy`
            })
            break;

        case 3:
            advice_card = new AdviceCard({
                class: "event",
                grade: type,
                title: "Too much CO2!",
                message: `Heyooo, suns out guns out.. ${pctIncrease}% increased solar enery production at the moment, enjou the clean energy`
            })
            break;

        default:
            console.log("Fucked up");
            break
    }

    // Save AdviceCard to MongoDB database
    advice_card.save(function (err) {
        if (err) {
            console.log("couldn't save advice");
        } else {

            // Find all users userprofile and populate advices with documents instead of IDs
            UserProfile.find({}).populate('advices').exec(function (err, user_profiles) {

                // Iterate over all found user_profiles
                for (let userprofile of user_profiles) {

                    // Check if a usersprofile contains more than 10 advices 
                    if (userprofile.advices.length >= 10) {

                        // Delete the oldest entry in userprofile.advices
                        while (userprofile.advices.length >= 10) {
                            userprofile.advices.shift();
                        }
                    }

                    // Push new AdviceCard Document to user advices array
                    userprofile.advices.push(advice_card.id);

                    // Save the users profile after changes
                    userprofile.save(function (err) {
                        if (err) {
                            console.log("couldn't save user profile");
                        } else {
                            console.log(`${userprofile.id} saved`);
                        }
                    });
                }
            });
        }
    });
};


async function monitorSolar() {
    try {
        // Fetch URI for solar data
        const URI =
            'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT "Minutes5DK", "PriceArea", "OffshoreWindPower", "OnshoreWindPower", "SolarPower" FROM "electricityprodex5minrealtime" ORDER BY "Minutes5UTC" DESC LIMIT 4032';
        let data = await fetch(URI).then((response) => response.json());

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
        // Push solar data points to array is timestamp is between 22:00 -> 05:00
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
        //console.log(`Average solar prod: ${average}`); // TEST

        // Calculate percentage difference average to current
        let pctIncrease = Math.floor((dataSolar[0] / average) * 100 - 100);

        /* ======= ADVICE CARD CREATION SECTION ====== */

        const SOLAR_GRADE = 1;

        // Compare current energy prod, with average
        if (dataSolar[0] <= average) { // change back to greater than
            // Check if any recent solar advices has been created
            if (!recentExists(SOLAR_GRADE)) {
                console.log("Recent advice doesn't exists");
                createAdvice(pctIncrease, SOLAR_GRADE);
            }
        } else {
            console.log("No card needed");
        }
    } catch (e) {
        console.error(e);
    } finally {
        console.log("Function Executed");
    }
};


async function monitorWind() {
    try {
        // Fetch URI for solar data
        const URI =
            'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT "OffshoreWindPower", "OnshoreWindPower" FROM "electricityprodex5minrealtime" ORDER BY "Minutes5UTC" DESC LIMIT 4032';
        let data = await fetch(URI).then((response) => response.json());

        // Create raw data arrays
        let dataTimestamp = [];
        let dataWind = [];

        let records = data.result.records;
        let totalWindDK1, totalWindDK2;
        // Find sum of DK1 and DK2 and push to arrays
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

        if (dataWind[0] <= average) {
            if (!recentExists(WIND_GRADE)) {
                console.log("current wind: " + dataWind[0]);
                console.log("Recent wind advicecard doesn't exists");
                createAdvice(pctIncrease, WIND_GRADE);
            }
        } else {
            console.log("Wind not blowing enough");
        }

    } catch (error) {
        console.error(e);
    } finally {
        console.log("Function Executed");
    }
};

// Ligger i update loop
//monitorSolar();

monitorWind();

//createAdvice()