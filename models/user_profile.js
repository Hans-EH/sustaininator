// Require Mongoose
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// User Profile Model
let userProfileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  devices: [{ type: Schema.Types.ObjectId, ref: "Device" }],
  advices: [{ type: Schema.Types.ObjectId, ref: "AdviceCard" }],
  firstname: { type: String },
  lastname: { type: String },
  pref_currency: { type: String },
  carbon_saved: { type: Number },
  carbon_footprint: { type: Number },
  sustainable_goals: { type: Number },
  total_energy_consumption_last_day: { type: Array, default: new Array(288).fill(0) },
  carbon_score_last_day: { type: [Boolean], default: new Array(288).fill(false)},
});

module.exports = mongoose.model("UserProfile", userProfileSchema);
