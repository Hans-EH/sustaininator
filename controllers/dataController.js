// auth controller for validating that user is logged in
let auth = require("../controllers/AuthController");

// Node fetch package
const fetch = require("node-fetch");

// Controller for calculating CO2 emission data
exports.co2emission = function (req, res, next) {
  async function fetchCO2energidata() {
    try {
      // Virker
      const DAYSAMOUNT = 30; //change in URI if this is changed.
      const URI =
        'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT"Minutes5UTC", "Minutes5DK", "PriceArea", "CO2Emission" FROM "co2emis" ORDER BY "Minutes5UTC" DESC LIMIT 17280'; //every second is a correct datapoint, we need for a month of datapoints which is 17280
      let data = await fetch(URI).then((response) => response.json());

      // Arrays for labels and values
      let dataLabels = [];
      let dataValues = [];

      let daysMonth = 30;
      let daysWeek = 7;
      let daysDays = 3;

      let dataValuesMonth = [];
      let dataValuesWeek = [];
      let dataValuesDays = [];

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
      function createData(days, newDataValues) {
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

      createData(daysMonth, dataValuesMonth);
      createData(daysWeek, dataValuesWeek);
      createData(daysDays, dataValuesDays);

      console.log("DataValues length" + dataValues.length + "\n");
      console.log("DataValuesMonth length" + dataValuesMonth.length + "\n");
      console.log("DataLabels length" + dataLabels.length + "\n");

      //a function that creates the percentile line using preexisting moving average and a percentile.
      function createPercentileLine(p, inputData) {
        //percentile to calculate to.
        //p = Math.ceil(100 / p);
        inputData.sort(compareNumbers);
        //calculating percentile
        let percentileNr = Math.floor((inputData.length / 100) * p);
        //new dataline to be filled for use as a graph.
        let newDataLine = [];
        console.log(
          100 -
            p +
            "% saving, nr: " +
            percentileNr +
            ", value: " +
            inputData[percentileNr]
        );
        //duplicate the result to every datapoint through the day
        //in order for it to be plottet nicely
        for (let i = 0; i < dataDay; i++) {
          newDataLine[i] = inputData[percentileNr];
        }
        return newDataLine;
      }

      //comparenumbers function, to be used with sort.
      function compareNumbers(a, b) {
        return a - b;
      }

      res.json(data);
    } catch (error) {
      console.error(error);
      res.send(false);
    }
  }

  fetchCO2energidata();
};

exports.tester = function (req, res, next) {
  async function testFetch() {
    try {
      const URI = process.env.WEB_HOST + "data/co2emission";
      let data = await fetch(URI).then((response) => response.json());

      res.json(data);
    } catch (error) {
      console.log(error);
    }
  }

  testFetch();
};
