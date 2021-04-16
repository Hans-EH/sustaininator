const mongoose = require('mongoose');

//Set up mongoose connection
let mongoDB = 'mongodb+srv://jsaad:augaug1@cluster0.g6o9l.mongodb.net/project_skarp?retryWrites=true&w=majority';
mongoose.connect(mongoDB, { useNewUrlParser: true , useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

let Device = require('./models/device');

function deviceCreate(name, power, activetime) {

    let device = new Device({
        name: name,
        power: power,
        activetime: activetime
    });

    device.save(function (err) {
        if (err) {return next(err) ;}

        console.log("Device saved!");
    });
};

//Create test devices - TO BE REMOVED IN PRODUCTION
deviceCreate('Ming', 1000, [false, true, false, false]);
deviceCreate('Jakob', 1200, [false, true, false, false]);
deviceCreate('Sture', 1500, [false, true, false, false]);
deviceCreate('Frederik', 800, [false, true, false, false]);