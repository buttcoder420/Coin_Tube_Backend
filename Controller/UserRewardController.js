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

// Claim Daily Reward
const claimReward = async (req, res) => {
  try {
    const userId = req.auth._id; // Assuming user is authenticated

    // Find user's last claimed reward
    const lastClaim = await UserDailyRewardModel.findOne({ userId }).sort({
      claimedAt: -1,
    });

    let nextDay = 1; // Default to day 1

    if (lastClaim) {
      const currentDate = new Date();
      const lastClaimDate = new Date(lastClaim.claimedAt);

      // Check if the last claim was made today
      const diffInTime = currentDate - lastClaimDate;
      const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

      if (diffInDays === 0) {
        // Calculate the time remaining for the next reward
        const nextClaimDate = new Date(lastClaimDate);
        nextClaimDate.setDate(lastClaimDate.getDate() + 1); // Next reward can be claimed after 24 hours
        nextClaimDate.setHours(0, 0, 0, 0); // Set to midnight

        const timeRemaining = nextClaimDate - currentDate;

        // Convert timeRemaining to hours, minutes, and seconds
        const hours = Math.floor(
          (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        return res.status(400).json({
          message: `You have already claimed today's reward. Next reward can be claimed in ${hours}h ${minutes}m ${seconds}s.`,
        });
      }

      // If last claim was yesterday, proceed with next day claim
      if (diffInDays === 1) {
        nextDay = parseInt(lastClaim.day) + 1;
        if (nextDay > 7) nextDay = 1; // Reset to day 1 after day 7
      } else if (diffInDays > 1) {
        nextDay = 1; // Reset to day 1 if the user didn't claim yesterday
      }
    }

    // Find the reward for the next available day
    let reward = await DailyRewardModel.findOne({
      day: nextDay.toString(),
    });

    // If no reward is found, claim the first reward from DailyRewardModel
    if (!reward) {
      reward = await DailyRewardModel.findOne().sort({ day: 1 }); // Get the first available reward
      if (!reward)
        return res.status(404).json({ message: "No rewards available!" });
    }

    // Save new claimed reward
    const newClaim = new UserDailyRewardModel({
      userId,
      rewardId: reward._id,
      coins: parseInt(reward.prize),
      amount: parseFloat(reward.amount),
      day: nextDay, // Store the day
    });
    await newClaim.save();

    // Update user's coins and amount
    await UserRegisterModel.findByIdAndUpdate(userId, {
      $inc: { coin: parseInt(reward.prize), amount: parseFloat(reward.amount) },
    });

    res.json({ message: "Reward claimed successfully!", reward: newClaim });
  } catch (error) {
    console.error(error); // Added error logging for better debugging
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getCurrentReward = async (req, res) => {
  try {
    const userId = req.auth._id;

    // User ka last claimed reward find karo (latest entry)
    const lastClaim = await UserDailyRewardModel.findOne({ userId })
      .sort({ claimedAt: -1 })
      .populate("rewardId"); // Jo reward claim hua tha, uski details bhi lao

    let nextReward = null;

    if (lastClaim) {
      const currentDate = new Date();
      const lastClaimDate = new Date(lastClaim.claimedAt);

      // **Check karo ke last claim aur aaj ke beech 24 ghantay ka farq hai ya nahi**
      const diffInHours = (currentDate - lastClaimDate) / (1000 * 3600);

      if (diffInHours >= 24) {
        // **Agar 24 hours guzar chuke hain, to next reward dhoondho**
        nextReward = await DailyRewardModel.findOne({
          _id: { $gt: lastClaim.rewardId }, // Next reward jo last claim ke baad ho
        }).sort({ _id: 1 });

        // **Agar koi next reward nahi mila, to cycle restart karo (Day 1 ka reward lo)**
        if (!nextReward) {
          nextReward = await DailyRewardModel.findOne().sort({ _id: 1 });
        }
      } else {
        // **Agar 24 ghantay nahi huay, to last claimed reward hi dikhao**
        nextReward = lastClaim.rewardId;
      }
    } else {
      // **Agar user ka koi bhi claim nahi mila, to Day 1 ka reward do**
      nextReward = await DailyRewardModel.findOne().sort({ _id: 1 });
    }

    res.json({
      message: `Your next reward is ready.`,
      reward: nextReward
        ? {
            prize: nextReward.prize,
            amount: nextReward.amount,
            day: nextReward.day,
          }
        : null,
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
