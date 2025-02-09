var { expressjwt: jwt } = require("express-jwt");
const UserRegisterModel = require("../Models/UserRegisterModel");
const DailyRewardModel = require("../Models/DailyRewardModel");

const requireSign = [
  jwt({
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
  }),
  (err, req, res, next) => {
    if (err.name === "UnauthorizedError") {
      return res.status(401).json({ message: "Invalid or missing token" });
    }
    next();
  },
];
const IsAdmin = async (req, res, next) => {
  try {
    const user = await UserRegisterModel.findById(req.auth._id);
    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied! Admin only." });
    }
    next();
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// ✅ Create a Daily Reward (Admin Only)
const createDailyReward = async (req, res) => {
  try {
    const { prize, amount, day } = req.body;

    const existingReward = await DailyRewardModel.findOne({ day });
    if (existingReward) {
      return res.status(400).json({
        success: false,
        message: "Reward for this day already exists!",
      });
    }

    const reward = new DailyRewardModel({ prize, amount, day });
    await reward.save();

    res.status(201).json({
      success: true,
      message: "Daily reward created successfully!",
      reward,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get All Daily Rewards
const getAllDailyRewards = async (req, res) => {
  try {
    const rewards = await DailyRewardModel.find().sort({ day: 1 });
    res
      .status(200)
      .json({ success: true, TotalReward: rewards.length, rewards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Single Daily Reward by Day
const getDailyRewardByDay = async (req, res) => {
  try {
    const { day } = req.params;
    const reward = await DailyRewardModel.findOne({ day });

    if (!reward) {
      return res
        .status(404)
        .json({ success: false, message: "No reward found for this day!" });
    }

    res.status(200).json({ success: true, reward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Daily Reward (Admin Only)
const updateDailyReward = async (req, res) => {
  try {
    const { id } = req.params;
    const { prize, amount, day, isActive } = req.body;

    const updatedReward = await DailyRewardModel.findByIdAndUpdate(
      id,
      { prize, amount, day, isActive },
      { new: true }
    );

    if (!updatedReward) {
      return res
        .status(404)
        .json({ success: false, message: "Reward not found!" });
    }

    res.status(200).json({
      success: true,
      message: "Daily reward updated successfully!",
      reward: updatedReward,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Daily Reward (Admin Only)
const deleteDailyReward = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReward = await DailyRewardModel.findByIdAndDelete(id);

    if (!deletedReward) {
      return res
        .status(404)
        .json({ success: false, message: "Reward not found!" });
    }

    res
      .status(200)
      .json({ success: true, message: "Daily reward deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  requireSign,
  IsAdmin,
  createDailyReward,
  getAllDailyRewards,
  getDailyRewardByDay,
  updateDailyReward,
  deleteDailyReward,
};
