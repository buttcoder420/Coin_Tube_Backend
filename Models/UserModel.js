const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    referralCode: { type: String, unique: true, default: null },
    referralLink: { type: String, unique: true, default: null },
    referredBy: { type: String, default: null },

    // Email verification fields
    isVerified: { type: Boolean, default: false }, // By default false
    verificationToken: { type: String }, // Store token for verification
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
