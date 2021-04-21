// Require Mongoose
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// User Profile Model
let userProfileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  firstname: { type: String },
  lastname: { type: String },
  pref_currency: { type: String },
  money_saved: { type: Number },
  carbon_saved: { type: Number },
  carbon_footprint: { type: Number },
  sustainable_goals: { type: Number },
});

module.exports = mongoose.model("UserProfile", userProfileSchema);
