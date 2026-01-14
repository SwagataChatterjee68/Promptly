const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "model", "system"],
    default: "user",
  },
}, {
  timestamps: true,
});

const messageModel = mongoose.model("AiMessage", messageSchema);
module.exports = messageModel;
