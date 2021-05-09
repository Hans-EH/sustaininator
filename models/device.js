const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let deviceSchema = new Schema({
    user_profile: {type: Schema.Types.ObjectId, ref: "UserProfile", required: true},
    name: {type: String, required: true},
    power: {type: Number, required: true},
    activetime: {type: [], default: new Array(24).fill(0)},
    state: {type: String, enum: ['ON', 'OFF'], default: 'OFF'},
    energy_consumption_last_day: {type: Array, default: new Array(288).fill(0)},
    lifetime_energy_consumption: {type: Number, default: 0}
});

//Virtual probability distribution for device
deviceSchema
    .virtual('probVector')
    .get(function () {
        let probVector = [];
        let activeIndex = [];

        /* Find the indexes with an on state in the onVector */
        for (let i = 0; i < this.activetime.length; i++) {
            if (this.activetime[i] === 1) {
                activeIndex.push(i)
            }
        }
        //activeIndex => [1, 9, 18]
        activeIndex = activeIndex.map(n => n * 12);

        //activeIndex => [12, (108), (216)]

        /* Find the index distance to the next active  */
        for (let i = 0; i < 24 * 12; i++) {
            probVector[i] = Math.min(...activeIndex.map(n => {
                return (Math.abs(n - i)) / 6
            }))
        }
        /* gaussian function */
        probVector = probVector.map(x => {
            return ((Math.exp(-(x ** 2)).toFixed(4)));
        })

        return probVector;
    });

// device.probVector
module.exports = mongoose.model('Device', deviceSchema);