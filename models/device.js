const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let deviceSchema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: "User", required: true},
    name: {type: String, required: true},
    power: {type: Number, required: true},
    activetime: {type: [], default: new Array(24).fill(0)},
});

// Virtual for device's URL
//deviceSchema
//    .virtual('url')
//    .get(function () {
//        return '/devices/device'+ this._id;
//    });

module.exports = mongoose.model('Device', deviceSchema);