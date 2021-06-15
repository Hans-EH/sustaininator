// Require Mongoose
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Advicecard model
let adviceCardSchema = new Schema({
    user_profile: { type: Schema.Types.ObjectId, ref: "UserProfile" },
    class: { type: String, enum: ["status", "event", "recommendation"] },
    grade: { type: Number },
    title: { type: String },
    message: { type: String },
    created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdviceCard', adviceCardSchema);