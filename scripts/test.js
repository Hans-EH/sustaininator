const fetch = require("node-fetch");
var mongoose = require("mongoose");
let AdviceCard = require("../models/advice_card");
const UserProfile = require("../models/user_profile");



const createSolarAdvice = (pctIncrease) => {
    console.log("entered");
    let mongoDB = "mongodb+srv://jsaad:augaug1@cluster0.g6o9l.mongodb.net/project_skarp?retryWrites=true&w=majority";
    mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
    var db = mongoose.connection;
    db.on("error", console.error.bind(console, "MongoDB connection error:"));
    console.log("connected");


    let advice_card = new AdviceCard({
        class: "event",
        grade: 1,
        title: "The Sun is out!",
        message: `Heyooo, suns out guns out.. ${pctIncrease}% increased solar enery production at the moment, enjou the clean energy`
    })

    advice_card.save(function (err) {
        if (err) { console.log("couldn't save advice"); } else {
            UserProfile.find({}).populate('advices').exec(function (err, user_profiles) {
                for (let userprofile of user_profiles) {
                    userprofile.advices.push(advice_card.id);

                    console.log(userprofile.advices.length);

                    userprofile.save(function (err) {
                        if (err) {
                            console.log("couldn't save user profile");
                        } else {
                            console.log(`${userprofile.id} saved`);
                        }
                    })
                }
            });
        }
    })
};

exports.monitorSolar = async function monitorSolar() {
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

        // "13" -> 13
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

        // Compare current energy prod, with average
        if (dataSolar[0] >= average) {
            console.log(`Current: ${dataSolar[0]} is greater than average: ${average}`); // TEST
            createSolarAdvice(pctIncrease);
        }

    } catch (e) {
        console.error(e);
    }
};


// Ligger i update loop
monitorSolar();



//createAdvice()