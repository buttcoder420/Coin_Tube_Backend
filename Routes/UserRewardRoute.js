// routes/dailyRewardRoutes.js
const express = require("express");
const {
  claimReward,
  requireSign,

  getCurrentReward,
} = require("../Controller/UserRewardController");

const router = express.Router();

router.post("/claim-reward", requireSign, claimReward);

// Route to get user’s last reward and next claim day
router.get("/reward-status", requireSign, getCurrentReward);

module.exports = router;
