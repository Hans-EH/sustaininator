// Require Mongoose
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// All saved website data Model
let websiteDataSchema = new Schema({
  carbon_30: { type: Array },
  carbon_7: { type: Array },
  carbon_3: { type: Array },
  carbon_1: { type: Array },
  labels_1: { type: Array },
  percentile_line: { type: Array }
});

module.exports = mongoose.model("websiteData", websiteDataSchema);
