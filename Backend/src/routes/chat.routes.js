const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { createChatController, getAllChatsController, deleteChatController } = require("../controllers/chat.controller");

const router = express.Router();

router.post("/", authMiddleware, createChatController);
router.get("/", authMiddleware, getAllChatsController);
router.delete("/:chatId", authMiddleware,deleteChatController);  


module.exports = router;
