const express = require("express");

const {
  loginController,
  registerController,
  requireSign,
  getUserBalance,
} = require("../Controller/UserController");

const router = express.Router();

//Registration route
router.post("/register", registerController);

//Login Route
router.post("/login", loginController);

//get coin aount
router.get("/balance", requireSign, getUserBalance);

module.exports = router;
