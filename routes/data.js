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

// GET offshore wind production data
//router.get("/offshorewind", dataController.greenenergi_off_wind);

// GET onshore wind production data
//router.get("/onshorewind", dataController.greenenergi_on_wind);

// GET solar production data
//router.get("/solar", dataController.greenenergi_solar);

// GET labels for energi production data
//router.get("/energilabels", dataController.greenenergi_labels);

// GET everything for green energi production
router.get("/greenenergy", dataController.greenEnergy);

// Exports router to app
module.exports = router;
