const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let deviceSchema = new Schema({
    name: {type: String, required: true},
    power: {type: Number, required: true},
    activetime: {type: [Boolean], default: new Array(24).fill(false)},
});

// Virtual for device's URL
//deviceSchema
//    .virtual('url')
//    .get(function () {
//        return '/devices/device'+ this._id;
//    });

module.exports = mongoose.model('Device', deviceSchema);


