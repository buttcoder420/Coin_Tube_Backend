const express = require("express");

const {
  loginController,
  registerController,
  verifyEmailController,
} = require("../Controller/UserController");

const router = express.Router();

//Registration route
router.post("/register", registerController);

//Login Route
router.post("/login", loginController);

router.get("/verify-email", verifyEmailController);

module.exports = router;
