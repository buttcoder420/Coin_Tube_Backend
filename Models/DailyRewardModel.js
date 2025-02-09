const mongoose = require("mongoose");

const dailyRewardSchema = new mongoose.Schema({
  prize: { type: String, required: true }, // Reward type (e.g., Coins, Bonus)
  amount: { type: String, required: true }, // Amount of reward
  day: { type: String, required: true, unique: true }, // Day number (e.g., 1,2,3,...)
  isActive: { type: Boolean, default: true }, // Active or inactive
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("reward", dailyRewardSchema);
