const express = require("express");
const {
  registerController,
  loginController,
  logoutController,
  profileController,
} = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/logout", logoutController);
router.get("/profile", authMiddleware, profileController);

module.exports = router;
