const express = require("express");
const {
  createDailyReward,
  requireSign,
  IsAdmin,
  getAllDailyRewards,
  getDailyRewardByDay,
  updateDailyReward,
  deleteDailyReward,
} = require("../Controller/DailyRewardController");

const router = express.Router();

// ✅ Create Daily Reward (Admin Only)
router.post("/daily-reward", requireSign, IsAdmin, createDailyReward);

// ✅ Get All Daily Rewards
router.get("/daily-reward", requireSign, getAllDailyRewards);

// ✅ Get Single Daily Reward by Day
router.get("/daily-reward/:day", requireSign, getDailyRewardByDay);

// ✅ Update Daily Reward (Admin Only)
router.put("/daily-reward/:id", requireSign, IsAdmin, updateDailyReward);

// ✅ Delete Daily Reward (Admin Only)
router.delete("/daily-reward/:id", requireSign, IsAdmin, deleteDailyReward);

module.exports = router;
