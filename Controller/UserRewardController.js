const { expressjwt: jwt } = require("express-jwt");
const DailyRewardModel = require("../Models/DailyRewardModel");
const UserDailyRewardModel = require("../Models/UserDailyRewardModel");
const UserRegisterModel = require("../Models/UserRegisterModel");

const requireSign = [
  jwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
  }),
  (err, req, res, next) => {
    if (err && err.name === "UnauthorizedError") {
      return res.status(401).json({ message: "Invalid or missing token" });
    }
    next();
  },
];

// **Claim Daily Reward**
const claimReward = async (req, res) => {
  try {
    const userId = req.auth?._id;
    const { isDouble } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No user ID found" });
    }

    // Check if the user has already claimed in the last 24 hours
    const lastClaim = await UserDailyRewardModel.findOne({ userId }).sort({
      claimedAt: -1,
    });

    if (lastClaim) {
      const lastClaimDate = new Date(lastClaim.claimedAt);
      const currentDate = new Date();
      const hoursDiff = (currentDate - lastClaimDate) / (1000 * 3600);

      if (hoursDiff < 24) {
        const nextClaimTime = new Date(lastClaim.claimedAt);
        nextClaimTime.setHours(nextClaimTime.getHours() + 24);
        return res.status(400).json({
          message: `You can claim again after ${nextClaimTime.toISOString()}`,
          nextClaimAt: nextClaimTime,
        });
      }
    }

    // Determine next reward
    let rewardId = null;

    if (lastClaim) {
      const lastReward = await DailyRewardModel.findById(lastClaim.rewardId);
      if (!lastReward) {
        return res.status(404).json({ message: "Previous reward not found!" });
      }
      rewardId = lastReward._id;
    } else {
      const firstReward = await DailyRewardModel.findOne();
      if (!firstReward) {
        return res.status(404).json({ message: "No rewards available!" });
      }
      rewardId = firstReward._id;
    }

    const reward = await DailyRewardModel.findById(rewardId);
    if (!reward) {
      return res.status(404).json({ message: "No rewards available!" });
    }

    let finalCoins = isDouble ? reward.prize * 2 : reward.prize;
    let finalAmount = reward.amount;
    let isDoubleStatus = isDouble ? "Yes" : "No";

    // Save claimed reward
    const newClaim = new UserDailyRewardModel({
      userId,
      rewardId: reward._id,
      coins: finalCoins,
      amount: finalAmount,
      isClaimed: true,
      isDouble: isDoubleStatus,
      claimedAt: new Date(),
    });

    await newClaim.save();

    // Update user coins and amount
    const userUpdate = await UserRegisterModel.findByIdAndUpdate(userId, {
      $inc: { coin: finalCoins, amount: finalAmount },
    });

    if (!userUpdate) {
      return res
        .status(400)
        .json({ message: "User not found or update failed" });
    }

    // Calculate next claim time
    let nextClaimAt = new Date();
    nextClaimAt.setHours(nextClaimAt.getHours() + 24);

    res.json({
      message: "Reward claimed successfully!",
      reward: {
        coins: finalCoins,
        amount: finalAmount,
        isClaimed: true,
        isDouble: isDoubleStatus,
      },
      nextClaimAt,
    });
  } catch (error) {
    console.error("Error claiming reward:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Get Current Reward**
const getCurrentReward = async (req, res) => {
  try {
    const userId = req.auth._id;

    const lastClaim = await UserDailyRewardModel.findOne({ userId })
      .sort({ claimedAt: -1 })
      .populate("rewardId");

    let nextReward = null;
    let nextClaimAt = null;

    if (lastClaim) {
      const currentDate = new Date();
      const lastClaimDate = new Date(lastClaim.claimedAt);
      const diffInHours = (currentDate - lastClaimDate) / (1000 * 3600);

      if (diffInHours >= 24) {
        // Find the next reward based on ID instead of day
        nextReward = await DailyRewardModel.findOne({
          _id: { $gt: lastClaim.rewardId._id },
        }).sort({ _id: 1 });

        // If no next reward found, restart from the first reward
        if (!nextReward) {
          nextReward = await DailyRewardModel.findOne().sort({ _id: 1 });
        }
      } else {
        nextReward = lastClaim.rewardId;
        nextClaimAt = new Date(lastClaim.claimedAt);
        nextClaimAt.setHours(nextClaimAt.getHours() + 24);
      }
    } else {
      // If no previous claim, get the first reward
      nextReward = await DailyRewardModel.findOne().sort({ _id: 1 });
    }

    res.json({
      message: "Your next reward is ready.",
      reward: nextReward
        ? {
            prize: nextReward.prize,
            amount: nextReward.amount,
            day: nextReward.day,
            id: nextReward._id, // Changed from 'day' to '_id'
          }
        : null,
      nextClaimAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  requireSign,
  claimReward,
  getCurrentReward,
};
