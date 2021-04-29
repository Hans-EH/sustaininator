// Require Mongoose
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// All saved website data Model
let carbonEmissionSchema = new Schema({
  date: { type: String },
  carbon_30: { type: Array },
  carbon_7: { type: Array },
  carbon_3: { type: Array },
  carbon_1: { type: Array },
  labels_1: { type: Array },
});

module.exports = mongoose.model("graph_data", carbonEmissionSchema);
