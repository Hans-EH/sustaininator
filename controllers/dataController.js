// auth controller for validating that user is logged in
let auth = require("../controllers/authcontroller");    // This appears unused
let graph_data = require("../models/cache_graph_data"); // This appears unused
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
      //console.log("this is data in fetchCO2data after uri fetch:", data);

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
      //  labels_1: data_labels,
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

//controller for creating the carbon graph
exports.carbon_data = function (req, res, next) {
  async function post_carbon_data() {
    try {
      //defining the arrays to be used
      let carbon_1 = [];
      let carbon_3 = [];
      let carbon_7 = [];
      let carbon_30 = [];
      let data_labels = [];
      const URI = process.env.WEB_HOST + "data/co2emission";
      let data = await fetch(URI).then((response) => response.json());
      //console.log("this is data in post_carbon_data after uri fetch:", data);
      const URL2 =
        'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT"Minutes5UTC", "Minutes5DK", "PriceArea", "CO2Emission" FROM "co2emis" ORDER BY "Minutes5UTC" DESC LIMIT 576'; //every second is a correct datapoint, we need for a month of datapoints which is 17280
      let labels = await fetch(URL2).then((response) => response.json());
      //console.log("this is labels in post_carbon_data after uri2 fetch:", data);
      //create the moving average datasets
      createData(1, data, carbon_1);
      createData(3, data, carbon_3)
      createData(7, data, carbon_7);
      createData(30, data, carbon_30);

      for (let i = 0; i < labels.result.records.length; i++) {
        // Push labels
        if (labels.result.records[i].PriceArea == "DK1") {
          data_labels.push(labels.result.records[i].Minutes5DK.slice(-8, -3));
        }
      }
      // Reverse Arrays
      data_labels = data_labels.reverse();

      res.json({ carbon_1, carbon_3, carbon_7, carbon_30, data_labels });

    } catch (error) {
      console.log(error);
    }
  }
  post_carbon_data();
};

//controller for creating the carbon moving average over 30 days graph
exports.carbon_data_30 = function (req, res, next) {
  async function post_carbon_data() {
    try {
      //defining the arrays to be used
      let carbon_30 = [];

      const URI = process.env.WEB_HOST + "data/co2emission";
      let data = await fetch(URI).then((response) => response.json());

      createData(30, data, carbon_30);

      res.json({ carbon_30 });

    } catch (error) {
      console.log(error);
    }
  }
  post_carbon_data();
};

// Controller for fetching and posting label data.
exports.forecastdata = function (req, res, next) {
  async function fetchforecastdata() {
    try {
      // Virker
      const URI =
        'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT"Minutes5UTC", "Minutes5DK", "PriceArea", "CO2Emission" FROM "co2emis" ORDER BY "Minutes5UTC" DESC LIMIT 17280'; //every second is a correct datapoint, we need for a month of datapoints which is 17280
      let raw_data_labels = await fetch(URI).then((response) => response.json());
      const URI2 = process.env.WEB_HOST + "data/co2emission";
      let raw_emissions_data = await fetch(URI2).then((response) => response.json());

      let labels = [];
      for (let i = 0; i < raw_data_labels.result.records.length; i++) {
        // Push labels
        if (raw_data_labels.result.records[i].PriceArea == "DK1") {
          labels.push(raw_data_labels.result.records[i].Minutes5DK.slice(8, 10) + " " + raw_data_labels.result.records[i].Minutes5DK.slice(-8, -3));
        }
      }
      // Reverse Arrays
      labels = labels.reverse();

      let data = [];
      let forecast_labels = [];
      let forecast_data = [];
      //adjust how many days back it should count
      let days_past = 5;
      //add extra labels and the new datapoints for forecasting the future:
      let days_forecasted = 3;

      for (let i = labels.length - (days_past * 12 * 24); i < labels.length; i++) {
        data.push(raw_emissions_data[i - 1]);
        forecast_labels.push(labels[i]);
      }

      //we look at the last element, minus days_forecasted days
      for (let i = (labels.length - days_forecasted * 12 * 24); i < labels.length; i++) {
        forecast_labels.push((parseInt(labels[i].slice(0, 2)) + days_forecasted) + " " + labels[i].slice(2, 8));
        //forecast_data.push(SARgenerate_forecast(3,3));
      }

      let best_model_placeholder = [];
      //this is just to copy the data to be displayed on the homepage
      best_model_placeholder = find_best_model(data, days_past);
      let best_model_order = best_model_placeholder[0];
      let best_model_fitness = best_model_placeholder[1];
      let median = avg(data, 0, data.length);
      let standard_deviation = STD(data, median);

      //moving average function with seasonality and a autoregressiv part.
      function generate_forecast(q, data, days_past, days_forecasted) {
        //amount of data points in a day
        let day = 12 * 24;
        let season_data = seasonal_view(data, day);
        //somehow fixes an error of going down to zero at forecasting. no idea.
        days_forecasted += 2;
        //forcastes days already gone by, using even older data.
        for (let d = days_past; d > 0; d--) {
          //starts at the oldest time, and goes forward to the newest time
          for (let t = day - 1; t >= 0; t--) {
            //convert the loops back, so that it goes from lowest to highest/last entry
            let n = data.length - (d * day) + ((day + 1) - t)
            //push forcast datapoints
            forecast_data.push(forecast_add_data(season_data[t], d, q, data[n]));
          }
        }
        //forecasts the future:
        for (let d = days_forecasted; d > 0; d--) {
          //loops through all the times of day
          for (let t = day - 1; t >= 0; t--) {
            forecast_data.push(forecast_add_data(season_data[t], d, q, forecast_data[forecast_data.length - 1]));
          }
        }
        //removing the extra 2 days created to solve som weird behavior in days_forecasted +=2
        forecast_data.splice(-day * 2, day * 2)

      };

      //gives back the MA result for 1 time of the day using seasonal data
      function forecast_add_data(data, from, order, pre_data) {
        //if the pre_data is a NaN, then copy previous entry again (error might happen between generating past data and future)
        if (isNaN(pre_data)) {
          pre_data = forecast_data[forecast_data.length - 1];
        }
        //gets the average value for the values in q orders back
        mu = avg(data, from, from + order);
        //new data created
        let eps = [];
        //pushes the initial epsilon value, as an error of the truevalue-median(mu)
        eps.push(data[from + order] - mu);
        //creates an array of the previous lags errors.
        for (i = 0; i < order; i++) {
          let error = data[from + order - i] - eps[i];
          //calculates the correlation, to be used as a weight indicating significance.
          let theta = correl(eps[i], pre_data, mu)
          eps.push(theta * error);
        }
        //sums the data,
        let sums = (sum(eps, 0, eps.length));
        let result = mu + sums
        result = bound(data, mu, pre_data, from, order, result);

        //console.log("STD: " + STD(data, mu) + "mu" + mu + ", sum:" + sums + "result: " + result + "previous_data:" + pre_data + "forecast_data: " + forecast_data[forecast_data.length - 1]);
        return result;
      }

      //finds the maximal movement of graph data
      function max_movement(data) {
        let movement = [];
        for (let i = 0; i < data.length - 1; i++) {
          movement.push(Math.abs(data[i] - Math.abs(data[i + 1])));
        } //take math sqrt because it makes the movements much smaller.
        return Math.sqrt(avg(movement, 0, movement.length));
      }

      //bounds the max and min function values
      function bound(data, mu, pre_data, from, order, result) {
        //tight bound, such that no entry can be larger than the average of mu and the previous entry plus STD
        //to hold it within realistic data level, and previous data level
        //this is an autoregressive part
        let c = pre_data;
        //so that it doesnt deviatte to far from the standard
        let x = STD(data.slice(from, from + order), mu);
        let max_mvmt = max_movement(data);
        if (result > c + x) {
          result = c + x;
        }
        if (result > forecast_data[forecast_data.length - 1] + max_mvmt) {
          result = forecast_data[forecast_data.length - 1] + max_mvmt;
        }
        if (result < -1 * x + c) {
          result = -1 * x + c;
        }
        if (result < forecast_data[forecast_data.length - 1] - max_mvmt) {
          result = forecast_data[forecast_data.length - 1] - max_mvmt;
        }
        //makes a minimum bound of 0.
        if (result <= 0) {
          result = 0;
        };
        return result;
      }

      //calculates standard deviation
      function STD(data, mu) {
        let std = 0;
        for (let i = 0; i < data.length; i++) {
          std += (data[i] - mu) * (data[i] - mu);
        }
        return Math.sqrt((std / data.length - 1));
      }

      //correlation function, the closer the data is to the previous number, the higher the weight
      function correl(eps, pre_data, mu) {
        let x = (eps - pre_data)
        //to not get an NaN error
        if (x < 1 && x > -1) { x = 1; }
        //takes sqrt, so that result isnt a tiny decimal
        if (x < 0) { result = -1 / Math.sqrt(Math.abs(x)) }
        else { result = 1 / Math.sqrt(x) }
        return result;
      }

      //gets the average from an array
      function avg(data, from, to) {
        let n = to - from;
        return sum(data, from, to) / n;
      }

      //sums a certain part of an array,
      function sum(data, from, to) {
        return data.slice(from, to).reduce((a, b) => a + b, 0);
      }

      function find_best_model(data, days_past) {
        let model_fits = 0;
        //set to a random high number
        let best_model = 10000;
        let best_model_order = 1;
        //loops through all ordes for the model, minus how many days that it backcasts.
        for (let i = 1; i < 29 - days_past; i++) {
          //generate the forecasted model:
          generate_forecast(i, raw_emissions_data, days_past, days_forecasted);
          model_fits = model_fit(data, days_past);
          //checking if the average deviation is smaller at a new order
          if (best_model > model_fits) {
            //if it is, note the order and the deviation.
            best_model = model_fits;
            best_model_order = i;
          }
          //emptien the array.
          forecast_data = [];
          //console.log(i + ": Model fitness: " + model_fits);
        }
        console.log("best order: " + best_model_order + ", with model fitness: " + best_model);
        generate_forecast(best_model_order, raw_emissions_data, days_past, days_forecasted);
        return ([best_model_order, best_model])
      }

      //calculates how well the model fits the data, by finding the deviation at each point
      function model_fit(data, days_past) {
        let data_diff = [];
        for (let i = 0; i < DATADAY * days_past; i++) {
          data_diff.push(Math.abs(data[i] - forecast_data[i]));
        }
        //returns the average deviation of the model from the backcasted data
        return avg(data_diff, 0, data_diff.length);
      }

      //seasonal creation of data, we push 30 days of data for the same time, in an array.
      function seasonal_view(data, day) {
        let seasonal_data = [];
        //this selects a new time for the day
        for (let time = 0; time < day; time++) {
          let time_data = [];
          //then each time of day has its own array made up of the entire data set for that time.
          for (let i = ((data.length + time) - 30 * day); i < data.length; i += day) {
            time_data.push(data[i]);
          }
          seasonal_data.push(time_data.reverse());
        }
        //now a 2D array with time of day on y axes, and the 30 days/entries for that time on the X axes.
        //where the last datapoint is at y = 0, x = 0, and the first datapoint at y = max, x = max.
        //data[time][day]
        return seasonal_data.reverse();
      }

      //test if all functions work correct:
      function forecast_test() {
        console.log("=========TESTING MA MODEL ==========\n");
        //create test data:
        let test_data = [];
        let day = 12 * 24
        for (let i = 1; i <= day * 30; i++) {
          test_data.push(i);
        }

        console.log("Testing seasonal_view():\n");
        let test_1 = seasonal_view(test_data, day);
        console.log("Seasonal_view should create an array on the form data[time][day], with closer to zero being more recent");
        console.log("last/most recent datapoint is at data[0][0]: " + (test_1[0].slice(0, 30)[0] == day * 30));
        console.log("datapoint for the same time as the last datapoint, but 1 day before is at data[0][1]: " + (test_1[0].slice(0, 30)[1] == day * 29));
        console.log("First datapoint is at data[288][30]: " + (test_1[day - 1].slice(0, 30)[30 - 1] == 1));
        console.log("second datapoint is at data[287][30]: " + (test_1[day - 2].slice(0, 30)[30 - 1] == 2));

        console.log("\nTesting sum():\n");
        console.log("using test_data: Sum of the first 5 data points: " + (sum(test_data, 0, 5) == 1 + 2 + 3 + 4 + 5));
        console.log("using test_data: Sum from datapoint 2 to 7 forward data points: " + (sum(test_data, 2, 7) == 3 + 4 + 5 + 6 + 7));
        console.log("using seasonal_data: The sum of data from the last entry, and the last 5 days equivalent time-datapoints: " + (sum(test_1[0], 0, 5) == day * 30 + day * 29 + day * 28 + day * 27 + day * 26));
        console.log("=====TESTING ENDED=====");

        console.log("avg of 1+2+3+4+5 should be 3: " + avg(test_data, 0, 5));
      }
      //forecast_test();

      res.json({ forecast_labels, data, forecast_data, days_past, days_forecasted, best_model_order, best_model_fitness, median, standard_deviation });
    } catch (error) {
      console.error(error);
      res.send(false);
    }
  }

  fetchforecastdata();
};

// Controller for green energy data
exports.greenEnergy = async function (req, res, next) {
  try {
    // Fetch values and timestamps from energidataservice.dk
    const URI =
      'https://www.energidataservice.dk/proxy/api/datastore_search_sql?sql=SELECT "Minutes5DK", "PriceArea", "OffshoreWindPower", "OnshoreWindPower", "SolarPower" FROM "electricityprodex5minrealtime" ORDER BY "Minutes5UTC" DESC LIMIT 576'; //576 = 1 day, 4032 = 1 week, 16128 = 4 weeks
    let data = await fetch(URI).then((response) => response.json());

    // Arrays for labels and values to be shown on green energy chart
    let dataTimestamp = [];
    let dataOffshoreWind = [];
    let dataOnshoreWind = [];
    let dataSolar = [];

    // Iterate over every other point in results adding east and west value-pair together for each time interval
    // Push values into respective data arrays
    for (let i = 0; i < data.result.records.length; i = i + 2) {
      dataTimestamp.push(data.result.records[i].Minutes5DK.slice(-8, -3));
      dataOffshoreWind.push(data.result.records[i].OffshoreWindPower + data.result.records[i + 1].OffshoreWindPower);
      dataOnshoreWind.push(data.result.records[i].OnshoreWindPower + data.result.records[i + 1].OnshoreWindPower);
      dataSolar.push(data.result.records[i].SolarPower + data.result.records[i + 1].SolarPower);
    }

    // Reverse arrays, since values come as newest-to-oldest, and we want to draw them from oldest-to-newest
    dataTimestamp = dataTimestamp.reverse();
    dataOffshoreWind = dataOffshoreWind.reverse();
    dataOnshoreWind = dataOnshoreWind.reverse();
    dataSolar = dataSolar.reverse();

    // Return arrays in response
    res.json({ dataTimestamp, dataOffshoreWind, dataOnshoreWind, dataSolar });
  } catch (error) {
    console.error(error);
    res.send(false);
  }
};