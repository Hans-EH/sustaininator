var express = require("express");
var router = express.Router();

// Controller imports
let dataController = require("../controllers/datacontroller");

// GET co2 emission data.
router.get("/co2emission", dataController.co2emission);

// GET emission data as average over a certain period and labels
router.get("/carbondata", dataController.carbon_data);

// GET forcast data, including labels, last 30 days and the forecast
router.get("/forecastdata", dataController.forecastdata);

// GET everything for green energy production
router.get("/greenenergy", dataController.greenEnergy);

// GET Carbon emission last 30 days
router.get("/carbon30", dataController.carbon_data_30)

// Exports router to app
module.exports = router;
