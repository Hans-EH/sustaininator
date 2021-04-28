const { body, validationResult } = require("express-validator");
let websiteData = require("../models/website_data");
let fetch = require("node-fetch");

exports.graph_data_fetch = function (req, res, next) {  // Create UserProfile from Model
    async function greenEnergiDataEMI() {
        try {
            const URI =
                'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT "Minutes5DK", "PriceArea", "OffshoreWindPower", "OnshoreWindPower", "SolarPower" FROM "electricityprodex5minrealtime" ORDER BY "Minutes5UTC" DESC LIMIT 576';
            let data = await fetch(URI).then((response) => response.json());

        } catch {
            console.log("ups");
        }
    }
    let graphData = new websiteData({
        raw_graph_data: [1, 2, 3, 5, 2],
    });
}

exports.carbon_emissions_data = async function (req, res, next) {
    try {
        const DAYSAMOUNT = 30; //change in URI if this is changed.
        const URI =
            'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT"Minutes5UTC", "Minutes5DK", "PriceArea", "CO2Emission" FROM "co2emis" ORDER BY "Minutes5UTC" DESC LIMIT 17280'; //every second is a correct datapoint, we need for a month of datapoints which is 17280

        let data = await fetch(URI).then((response) => response.json());

        // Arrays for labels and values
        let dataLabels = [];
        let dataValues = [];
        let dataValuesMonth = [];
        let daysMonth = 30;
        let dataValuesWeek = [];
        let daysWeek = 7;
        let dataValuesDays = [];
        let daysDays = 3;
        //datapoints on 1 day
        let dataDay = (60 * 24) / 5;
        // Iterate over reponse results
        console.log("Total CO2 Rows:" + data.result.records.length);

        for (let i = 0; i < data.result.records.length; i++) {
            // Push labels and values
            if (data.result.records[i].PriceArea == "DK1") {
                dataValues.push(data.result.records[i].CO2Emission);
                dataLabels.push(data.result.records[i].Minutes5DK.slice(-8, -3));
            }
        }
        // Reverse Arrays
        dataLabels = dataLabels.reverse();
        dataValues = dataValues.reverse();
        //Function that creates a moving average dataset depended on amount of days.
        function createMovingAverage(days, newDataValues) {
            //total data points
            let dataTotal = days * dataDay;
            for (let j = 0; j < dataDay; j++) {
                newDataValues[j] = 0;
                for (let i = j; i < dataTotal; i += dataDay) {
                    //compounds the values
                    newDataValues[j] +=
                        dataValues[i + (dataDay * DAYSAMOUNT - dataTotal)];
                }
                //finds average for that time
                newDataValues[j] = newDataValues[j] / days;
            }
        }

        createMovingAverage(daysMonth, dataValuesMonth);
        createMovingAverage(daysWeek, dataValuesWeek);
        createMovingAverage(daysDays, dataValuesDays);
        console.log("DataValues length" + dataValues.length + "\n");
        console.log("DataValuesMonth length" + dataValuesMonth.length + "\n");
        console.log("DataLabels length" + dataLabels.length + "\n");

        console.log("6");

        let graphData = new websiteData({
            carbon_30: dataValuesMonth,
            carbon_7: dataValuesWeek.slice(0, dataDay),
            carbon_3: dataValuesDays.slice(0, dataDay),
            carbon_1: dataValues.slice(dataValues.length - dataDay, dataValues.length),
            labels_1: dataLabels.slice(dataLabels.length - dataDay, dataLabels.length),
            percentile_line: [1, 2, 3, 5],
            //    percentile_line: createPercentileLine(,dataValuesMonth).slice(0, dataDay)
        })
        return graphData;
    } catch (e) {
        console.log(e);
    }
}


//comparenumbers function, to be used with sort.
//function compareNumbers(a, b) {
//    return a - b;
//}

//a function that creates the percentile line using preexisting moving average and a percentile.
//function createPercentileLine(p, inputData) {
//    //percentile to calculate to.
//    //p = Math.ceil(100 / p);
//    inputData.sort(compareNumbers);
//    //calculating percentile
//    let percentileNr = Math.floor((inputData.length / 100) * p);
//    //new dataline to be filled for use as a graph.
//    let newDataLine = [];
//    console.log(
//        100 -
//        p +
//        "% saving, nr: " +
//        percentileNr +
//        ", value: " +
//        inputData[percentileNr]
//    );
//    //duplicate the result to every datapoint through the day
//    //in order for it to be plottet nicely
//    for (let i = 0; i < dataDay; i++) {
//        newDataLine[i] = inputData[percentileNr];
//    }
//    return newDataLine;
//}

exports.data_get = async function (req, res) {
    try {
        console.log("hej");
        let graph_data = await [1, 3, 5, 2, 3];
        return [1, 3, 5, 2, 3];
    } catch {
        console.log("data_get not working");
    }
}


//    const ca = [{{ cache_data }}];
//for (let i = 0; i < ca.length; i++) {
//    console.log(ca[i]);
//}
//console.log(typeof ({{ cache_data }}));
//console.log("{{ cache_data }}");

//console.log(`${100-2}`);

//fetch catch