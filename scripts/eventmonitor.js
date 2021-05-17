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
 * @return true if above, false otherwise
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
                message: `Heyooo, sun's out guns out.. ${pctIncrease}% increased solar energy production at the moment, enjoy the clean energy`
            });
            break;

        case 2:
            advice_card = new AdviceCard({
                class: "event",
                grade: type,
                title: "It's windy today!",
                message: `Woohooo, hold on to your hats! ${pctIncrease}% increased wind energy production at the moment, don't blow your chance to use all that clean energy`
            });
            break;

        case 3:
            advice_card = new AdviceCard({
                class: "event",
                grade: type,
                title: "Too much CO2!",
                message: `Uh oh, CO2 levels are.. ${pctIncrease}% above average at the moment, you can help the environment by delaying energy hungry activities`
            });
            break;

        case 4:
            advice_card = new AdviceCard({
                class: "event",
                grade: type,
                title: "Low CO2 emissions",
                message: `Yay, CO2 levels are.. ${pctIncrease}% below average at the moment`
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
                console.log("Recent Solar advicecard doesn't exists");
                return [true, pctIncrease];
            } else {
                console.log("Recent Solar advicecard exists"); // DEBUGGING
                return [false];
            }
        } else {
            console.log("No card needed");
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
                console.log("Recent Wind advicecard doesn't exists");
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
                console.log("Recent Carbon advicecard doesn't exists");
                return [true, pctIncrease];
            } else {
                console.log("Recent Carbon advicecard exists"); // DEBUGGING
                return [false];
            }
        } else {
            console.log("No carbon card needed");
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
        if (carbon_now <= median) { // change back to greater than
            // Check if any recent solar advices has been created
            if (await recentExists(CARBON_LOW_GRADE) == false) {
                console.log("Recent Carbon advicecard doesn't exists");
                return [true, Math.abs(pctIncrease)];
            } else {
                console.log("Recent Carbon advicecard exists"); // DEBUGGING
                return [false];
            }
        } else {
            console.log("No carbon card needed");
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