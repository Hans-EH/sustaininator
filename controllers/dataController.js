// auth controller for validating that user is logged in
let auth = require("../controllers/AuthController");
let graph_data = require("../models/cache_graph_data");
// Node fetch package
const fetch = require("node-fetch");


//datapoints on 1 day
const DATADAY = (60 * 24) / 5;

// Controller for calculating CO2 emission data
exports.co2emission = function (req, res, next) {
  async function fetchCO2data() {
    try {
      // Virker
      const URI =
        'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT"Minutes5UTC", "Minutes5DK", "PriceArea", "CO2Emission" FROM "co2emis" ORDER BY "Minutes5UTC" DESC LIMIT 17280'; //every second is a correct datapoint, we need for a month of datapoints which is 17280
      let data = await fetch(URI).then((response) => response.json());

      let dataValues = [];

      for (let i = 0; i < data.result.records.length; i++) {
        // Push labels and values
        if (data.result.records[i].PriceArea == "DK1") {
          dataValues.push(data.result.records[i].CO2Emission);
        }
      }
      // Reverse Arrays
      dataValues = dataValues.reverse();

      //saving data to mongodb
      //var new_graph_data = new graph_data({
      //  date: Date(),
      //  carbon_30: dataValuesMonth,
      //  carbon_7: dataValuesWeek,
      //  carbon_3: dataValuesDays,
      //  carbon_1: dataValues,
      //  labels_1: dataLabels,
      //})
      //new_graph_data.save(function (err, result) {
      //  if (err) {
      //    console.log(err);
      //  }
      //  else {
      //    //console.log(result)
      //  }
      //})

      res.json(dataValues);
    } catch (error) {
      console.error(error);
      res.send(false);
    }
  }

  fetchCO2data();
};

// Controller for fetching and posting label data.
exports.co2emissionlabels = function (req, res, next) {
  async function fetchlabeldata() {
    try {
      // Virker
      const URI =
        'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT"Minutes5UTC", "Minutes5DK", "PriceArea", "CO2Emission" FROM "co2emis" ORDER BY "Minutes5UTC" DESC LIMIT 17280'; //every second is a correct datapoint, we need for a month of datapoints which is 17280
      let data = await fetch(URI).then((response) => response.json());

      let dataLabels = [];

      for (let i = 0; i < data.result.records.length; i++) {
        // Push labels
        if (data.result.records[i].PriceArea == "DK1") {
          dataLabels.push(data.result.records[i].Minutes5DK.slice(-8, -3));
        }
      }
      // Reverse Arrays
      dataLabels = dataLabels.reverse();

      res.json(dataLabels);
    } catch (error) {
      console.error(error);
      res.send(false);
    }
  }

  fetchlabeldata();
};

//Function that creates a moving average dataset depended on amount of days.
function createData(days, dataValues, newDataValues) {
  //total data points
  let dataTotal = days * DATADAY;
  for (let j = 0; j < DATADAY; j++) {
    newDataValues[j] = 0;
    for (let i = j; i < dataTotal; i += DATADAY) {
      //compounds the values
      newDataValues[j] +=
        dataValues[i + (DATADAY * 30 - dataTotal)];
    }
    //finds average for that time
    newDataValues[j] = newDataValues[j] / days;
  }
}

//exports moving average for co2 emissions throughout 30 days
exports.carbon_30 = function (req, res, next) {
  async function carbon_30_post() {
    try {
      let carbon_30 = [];
      const URI = process.env.WEB_HOST + "data/co2emission";
      let data = await fetch(URI).then((response) => response.json());
      createData(30,data,carbon_30);
      res.json(carbon_30);
    } catch (error) {
      console.log(error);
    }
  }
  carbon_30_post();
};

//exports moving average for co2 emissions throughout 7 days
exports.carbon_7 = function (req, res, next) {
  async function carbon_7_post() {
    try {
      let carbon_7 = [];
      const URI = process.env.WEB_HOST + "data/co2emission";
      let data = await fetch(URI).then((response) => response.json());
      createData(7,data,carbon_7);
      res.json(carbon_7);
    } catch (error) {
      console.log(error);
    }
  }
  carbon_7_post();
};

//exports moving average for co2 emissions throughout 3 days
exports.carbon_3 = function (req, res, next) {
  async function carbon_3_post() {
    try {
      let carbon_3 = [];
      const URI = process.env.WEB_HOST + "data/co2emission";
      let data = await fetch(URI).then((response) => response.json());
      createData(3,data,carbon_3);
      res.json(carbon_3);
    } catch (error) {
      console.log(error);
    }
  }
  carbon_3_post();
};


//exports moving average for co2 emissions throughout 1 day
exports.carbon_1 = function (req, res, next) {
  async function carbon_1_post() {
    try {
      let carbon_1 = [];
      const URI = process.env.WEB_HOST + "data/co2emission";
      let data = await fetch(URI).then((response) => response.json());
      createData(1,data,carbon_1);
      res.json(carbon_1);
    } catch (error) {
      console.log(error);
    }
  }
  carbon_1_post();
};
