const JWT = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();
const nodemailer = require("nodemailer");
// JWT Middleware
var { expressjwt: jwt } = require("express-jwt");
const { ComparePassword, HashPassword } = require("../Helper/UserHelper");
const UserRegisterModel = require("../Models/UserRegisterModel");

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

// Function to generate a unique referral code
const generateReferralCode = async () => {
  let isUnique = false;
  let referralCode;

  while (!isUnique) {
    referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const existingUser = await UserModel.findOne({ referralCode });
    if (!existingUser) isUnique = true;
  }

  return referralCode;
};

// Generate referral link dynamically
const generateReferralLink = (referralCode) => {
  const baseUrl =
    process.env.BASE_URL || "https://coin-tube-backend-el9n.onrender.com";
  return `${baseUrl}/register?ref=${referralCode}`;
};

// **Login Controller**
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await UserRegisterModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).send({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    // Check password
    const match = await ComparePassword(password, user.password);
    if (!match) {
      return res.status(401).send({
        success: false,
        message: "Invalid password",
      });
    }

    // Create token
    const token = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).send({
      success: true,
      message: "Login successful",
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
};

// **Register Controller**
// **Register Controller**
const registerController = async (req, res) => {
  try {
    const { name, email, phone, password, referralCode } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).send({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await UserRegisterModel.findOne({ email });
    if (existingUser) {
      return res.status(409).send({
        success: false,
        message: "Email already registered. Please login.",
      });
    }

    // Hash password
    const hashedPassword = await HashPassword(password);

    // Generate referral code and link
    const newReferralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const referralLink = `https://coin-tube-backend-el9n.onrender.com/login?referralCode=${newReferralCode}`;

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString("hex");

    // Register new user
    const userRegister = new UserRegisterModel({
      name,
      email,
      phone,
      password: hashedPassword,
      referralCode: newReferralCode,
      referralLink,
      verificationToken,
    });

    // Handle referral logic
    if (referralCode) {
      const referringUser = await UserModel.findOne({ referralCode });
      if (referringUser) {
        referringUser.totalReferred = (referringUser.totalReferred || 0) + 1;
        await referringUser.save();

        userRegister.referredBy = referralCode;
      }
    }

    await userRegister.save();

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    res.status(201).send({
      success: true,
      message: "User registered successfully. Please verify your email.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in registration",
      error,
    });
  }
};

module.exports = {
  requireSign,
  loginController,
  registerController,
};
