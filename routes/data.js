var express = require("express");
var router = express.Router();

// Controller imports
let dataController = require("../controllers/datacontroller");

// GET co2 emission data.
router.get("/co2emission", dataController.co2emission);

// GET co2 emission data.
router.get("/co2emissionlabels", dataController.co2emissionlabels);

// GET co2 emission data 30 days moving average.
router.get("/carbon30", dataController.carbon_30);

// GET co2 emission data 7 days moving average.
router.get("/carbon7", dataController.carbon_7);

// GET co2 emission data 3 days moving average.
router.get("/carbon3", dataController.carbon_3);

// GET co2 emission data 1 days moving average.
router.get("/carbon1", dataController.carbon_1);

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
