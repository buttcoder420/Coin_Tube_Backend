const express = require("express");

const {
  loginController,
  registerController,
} = require("../Controller/UserController");

const router = express.Router();

//Registration route
router.post("/register", registerController);

//Login Route
router.post("/login", loginController);

module.exports = router;
