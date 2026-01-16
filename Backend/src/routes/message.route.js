const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { getMessagesController, deleteMessageController } = require("../controllers/message.controller");


const router = express.Router();

router.get("/:chatId",authMiddleware,getMessagesController); 


module.exports = router;
