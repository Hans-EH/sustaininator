var express = require("express");
var router = express.Router();

// Controller imports
let dataController = require("../controllers/dataController");

// GET co2 emission data.
router.get("/co2emission", dataController.co2emission);

// GET co2 emission data.
router.get("/tester", dataController.tester);

// Exports router to app
module.exports = router;
