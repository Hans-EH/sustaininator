const fetch = require("node-fetch");
let AdviceCard = require("../models/advice_card");
const UserProfile = require("../models/user_profile");
const ONE_HOUR = 3600000;
const SOLAR_GRADE = 1;
const WIND_GRADE = 2;
const CARBON_HIGH_GRADE = 3;
const CARBON_LOW_GRADE = 4;
const MAX_ADVICES = 4;

/**
 * Function used find out if a card of similar type has been
 * created in the time between now and the ONE_HOUR constant
 * @param {*} grade Recieces the grade of that should be checked
 * @return true if above, false otherwise
 */
async function recentExists(grade) {
    let exists = false;
    await AdviceCard.find({ class: "event", grade: grade })
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
 */
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
                message: `Heyooo, sun's out guns out.. we're seeing ${pctIncrease}% increased solar energy production at the moment, enjoy the clean energy. And probably the great weather, too! Remember to use sunscreen! Unless it's raining... we didn't check for that. Sorry.`
            });
            break;

        case 2:
            advice_card = new AdviceCard({
                class: "event",
                grade: type,
                title: "It's windy today!",
                message: `Woohooo, hold on to your hats! ${pctIncrease}% increased wind energy production, don't blow your chance to use all that cheap, clean energy. By the way, do you know why wind energy is so cheap? Because the birds already paid the price... well, Enjoy!`
            });
            break;

        case 3:
            advice_card = new AdviceCard({
                class: "event",
                grade: type,
                title: "Too much CO2!",
                message: `Uh oh, current CO2 levels are ${pctIncrease}% above average. You can help the environment by delaying energy hungry activities. You wouldn't want to be responsible for global warming now, would you? Not that we're logging your information or anything.`
            });
            break;

        case 4:
            advice_card = new AdviceCard({
                class: "event",
                grade: type,
                title: "Low CO2 emissions",
                message: `Yay, CO2 levels are ${pctIncrease}% below average. Now is the time to charge your devices and find excuses for why you can't hoover right now. So plug in that Tesla, blast your favourite music, and bake a cake. It's partytime! With a clean conscience!`
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

/**
 * Creates a status card for the user profile
 * @param {*} grade The grading of the card, ranges from 1..5
 */
exports.createStatusCard = function (grade, profile) {
    
    let advice_card;
    switch (grade) {
        case 1:
            advice_card = new AdviceCard({
                user_profile: profile,
                class: "status",
                grade: grade,
                title: "You're a true climate hero!",
                message: `Very impressive! Your CO2 emissions stayed under your goal over 80% of the time. You either set your goals too low, or you're just THAT good. Now challenge yourself, raise the bar and be the climate hero you were born to be!`
            });
            break;

        case 2:
            advice_card = new AdviceCard({
                user_profile: profile,
                class: "status",
                grade: grade,
                title: "You're doing great!",
                message: `Wooow, you have kept your CO2 emissions under your goal more than 60% of the time. You're clearly doing something right. Keep doing that! Maybe share your success with others to inspire them to make the same positive change you have. Keep up the good work buddy!`
            });
            break;

        case 3:
            advice_card = new AdviceCard({
                user_profile: profile,
                class: "status",
                grade: grade,
                title: "Keep calm and keep trying!",
                message: `Hang in there! You stayed under your emission goals over 40% of the time. To improve your performance, use energy in periods with low CO2 emmission. Visit us often for advice and see our graphs for the best times to use energy. We have faith in you!`
            });
            break;

        case 4:
            advice_card = new AdviceCard({
                user_profile: profile,
                class: "status",
                grade: grade,
                title: "Need a bit of help?",
                message: `Not bad, but not great. Your CO2 emissions were under your goals over 20% of the time. There's room to improve. Ask yourself: "Do I really need hot food? We know cooked rice is great and all, but we're kind of trying to save the environment.`
            });
            break;

        case 5:
            advice_card = new AdviceCard({
                user_profile: profile,
                class: "status",
                grade: grade,
                title: "How dare you!",
                message: "Oh, dear. That's not quite what we hoped for, is it? Your CO2 emissions stayed below your goal less than 20% of the time. But what's a bit extra of CO2, really? The sea levels will be fine... Our advice: Consider buying a boat!"
            });
            break;


        default:
            console.log("Incorrect grade received by switch");
            break;
    }

    //Save the advice status card
    advice_card.save(function (err) {
        if (err) {return new Error("Status card failed to save!")}
    })
    //Save status card to profile advices list
    if (profile.advices.length === MAX_ADVICES){
        profile.advices.shift()
        profile.advices.push(advice_card)
    }
    else {
        profile.advices.push(advice_card)
    }

    profile.save(function(err) {
        if (err) {return new Error(`Status card could not be saved for profile: ${profile.firstname}`)}
    })
    
}
/**
 * Deletes the latest status card from user profile
 * @param {*} profile User profile instance
 */
exports.deleteStatusCard = function (profile) {

    //Update the advices list by filtering out cards with status class
    profile.advices = profile.advices.filter(card => card.class != "status");

    //Save the profile
    profile.save(function (err) {
        if (err) {return new Error(`Status card could not be deleted for profile: ${profile.firstname}`)}
    })
}

/**
 * Function used the calculate of the current solar energy production
 * is higher or lower than the average production in one week.
 * @param {*} data from energinet.dk, that is data about the danish energy production.
 * @return [true, pctIncrease] or [false];
 */
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
            if (await recentExists(SOLAR_GRADE) == false) {
                console.log("Recent Solar advicecard doesn't exist");
                return [true, pctIncrease];
            } else {
                console.log("Recent Solar advicecard exists"); // DEBUGGING
                return [false];
            }
        } else {
            console.log("Not enough sun");
            return [false];
        }
    } catch (e) {
        console.error(e);
    } finally {
        console.log("--> monitorSolar Executed");
    }
};

/**
 * Function used the calculate of the current wind energy production
 * is higher or lower than the average production in one week.
 * @param {*} data from energinet.dk, that is data about the danish energy production.
 * @return [true, pctIncrease] or [false];
 */
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


        console.log(`---> Wind Current: ${dataWind[0]} - Average: ${average}`);

        /* ======= ADVICE CARD CREATION SECTION ====== */

        if (dataWind[0] >= average) { // remember to flip sign to >= for actual use case
            if (await recentExists(WIND_GRADE) == false) {
                console.log("Recent Wind advicecard doesn't exist");
                return [true, pctIncrease];
            } else {
                console.log("Recent Wind advicecard exists"); // DEBUGGING
                return [false];
            }
        } else {
            console.log("Wind not blowing enough");
            return [false];
        }
    } catch (error) {
        console.error(error);
    } finally {
        console.log("--> MonitorWind Executed");
    }
};

/**
 * Function used the calculate of CO2 emission used in energy production
 * is higher than the average emissions in one week.
 * @param {*} data - preprocessed data from energinet.dk but from our own endpoint
 * @return [true, pctIncrease] or [false];
 */
async function monitorHighCarbon() {
    try {

        console.log("\n == CARBON HIGH MONITOR ==");

        // Fetch carbon data - processed energynet production data
        const URI = process.env.WEB_HOST + "data/carbondata";
        let data = await fetch(URI).then((response) => response.json());

        //sorts the carbon_30 data.
        data.carbon_30.sort();

        //Find the entry in the middle, which corrosponds with the median entry. 
        let median = data.carbon_30[Math.floor(data.carbon_30.length / 2)];

        //Find the entry in the middle, which corrosponds with the median entry. 
        let carbon_now = data.carbon_1[data.carbon_1.length - 1];

        //find procent increase/decrease from the median
        let pctIncrease = Math.floor((carbon_now / median) * 100 - 100);


        console.log(`---> Carbon Current: ${carbon_now} - Average: ${median}`);

        /* ======= ADVICE CARD CREATION SECTION ====== */
        // Compare current energy prod, with average
        if (carbon_now >= median) { // change back to greater than
            // Check if any recent solar advices has been created
            if (await recentExists(CARBON_HIGH_GRADE) == false) {
                console.log("Recent Carbon advicecard doesn't exist");
                return [true, pctIncrease];
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
        console.log("--> Monitor Carbon High Executed");
    }
}

/**
 * Function used the calculate of CO2 emission used in energy production
 * is lower than the average emissions in one week.
 * @param {*} data - preprocessed data from energinet.dk but from our own endpoint
 * @return [true, pctIncrease] or [false];
 */
async function monitorLowCarbon() {
    try {

        console.log("\n == CARBON LOW MONITOR ==");

        // Fetch carbon data - processed energynet production data
        const URI = process.env.WEB_HOST + "data/carbondata";
        let data = await fetch(URI).then((response) => response.json());

        //sorts the carbon_30 data.
        data.carbon_30.sort();

        //Find the entry in the middle, which corrosponds with the median entry. 
        let median = data.carbon_30[Math.floor(data.carbon_30.length / 2)];

        //Find the entry in the middle, which corrosponds with the median entry. 
        let carbon_now = data.carbon_1[data.carbon_1.length - 1];

        //find procent increase/decrease from the median
        let pctIncrease = Math.floor((carbon_now / median) * 100 - 100);

        console.log(`---> Carbon Current: ${carbon_now} - Average: ${median}`);

        /* ======= ADVICE CARD CREATION SECTION ====== */
        // Compare current energy prod, with average
        if (carbon_now < median) { // change back to greater than
            // Check if any recent solar advices has been created
            if (await recentExists(CARBON_LOW_GRADE) == false) {
                console.log("Recent Carbon advicecard doesn't exist");
                return [true, Math.abs(pctIncrease)];
            } else {
                console.log("Recent Carbon advicecard exists"); // DEBUGGING
                return [false];
            }
        } else {
            console.log("Carbondioxide low");
            return [false];
        }

    } catch (e) {
        console.error(e);
    } finally {
        console.log("--> Monitor Carbon Low Executed");
    }
}

exports.eventCallStack = async function eventCallStack() {
    // Fetch Energinet.dk - danish energy production data
    const URI =
        'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT "Minutes5DK", "PriceArea", "OffshoreWindPower", "OnshoreWindPower", "SolarPower" FROM "electricityprodex5minrealtime" ORDER BY "Minutes5UTC" DESC LIMIT 4032';
    let data = await fetch(URI).then((response) => response.json());

    console.log("\n== before advice creation ==");

    // *_sc -> should create advice 
    const solar_sc = await monitorSolar(data);
    const wind_sc = await monitorWind(data);
    const carbon_high_sc = await monitorHighCarbon();
    const carbon_low_sc = await monitorLowCarbon();

    let solar_advice = null;
    if (solar_sc[0] == true) {
        solar_advice = await createAdvice(solar_sc[1], SOLAR_GRADE);
    }

    let wind_advice = null;
    if (wind_sc[0] == true) {
        wind_advice = await createAdvice(wind_sc[1], WIND_GRADE);
    }

    let carbon_high_advice = null;
    if (carbon_high_sc[0] == true) {
        carbon_high_advice = await createAdvice(carbon_high_sc[1], CARBON_HIGH_GRADE);
    }

    let carbon_low_advice = null;
    if (carbon_low_sc[0] == true) {
        carbon_low_advice = await createAdvice(carbon_low_sc[1], CARBON_LOW_GRADE);
    }

    // Save the users profile after changes
    if (solar_sc[0] == true || wind_sc[0] == true || carbon_high_sc[0] == true || carbon_low_sc[0] == true) {
        UserProfile.find({}).populate('advices').exec(function (err, user_profiles) {
            console.log("\n== entering saving ==");

            for (let userprofile of user_profiles) {

                if (solar_sc[0]) {
                    while (userprofile.advices.length >= MAX_ADVICES) {
                        userprofile.advices.shift();
                    }
                    userprofile.advices.push(solar_advice);
                }

                if (wind_sc[0]) {
                    while (userprofile.advices.length >= MAX_ADVICES) {
                        userprofile.advices.shift();
                    }
                    userprofile.advices.push(wind_advice);
                }

                if (carbon_high_sc[0]) {
                    while (userprofile.advices.length >= MAX_ADVICES) {
                        userprofile.advices.shift();
                    }
                    userprofile.advices.push(carbon_high_advice);
                }

                if (carbon_low_sc[0]) {
                    while (userprofile.advices.length >= MAX_ADVICES) {
                        userprofile.advices.shift();
                    }
                    userprofile.advices.push(carbon_low_advice);
                }

                userprofile.save(function (err) {
                    if (err) { console.log(`couldn't save user profile \n ${err}`); }
                    else { console.log(`${userprofile.id} saved `); }
                });
            }
        });
    };
}