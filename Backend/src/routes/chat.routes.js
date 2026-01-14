const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { createChatController } = require("../controllers/chat.controller");

const router = express.Router();

router.post("/", authMiddleware, createChatController);

module.exports = router;
