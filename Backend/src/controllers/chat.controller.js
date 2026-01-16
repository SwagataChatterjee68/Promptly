const chatModel = require("../models/chat.model");
const messageModel = require("../models/aiMessage.model");
const { deleteChatMemory } = require("../services/vector.service");

const createChatController = async (req, res) => {
  const { title } = req.body;
  const user = req.user;

  const chat = await chatModel.create({
    title,
    user: user._id,
  });

  res.status(201).json({
    message: "Chat created successfully",
    chat: {
      _id: chat._id,
      user: chat.user,
      title: chat.title,
      lastActivity: chat.lastActivity,
    },
  });
};
const getAllChatsController = async (req, res) => {
  try {
    const chats = await chatModel
      .find({ user: req.user._id })
      .sort({ lastActivity: -1 }); // Newest first

    res.status(200).json({ chats });
  } catch (error) {
    res.status(500).json({ message: "Error fetching chats" });
  }
};
const deleteChatController = async (req, res) => {
  const { chatId } = req.params;

  try {
    // 1. Verify Chat ownership & Existence
    const chat = await chatModel.findOne({
      _id: chatId,
      user: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found or unauthorized" });
    }

    // 2. Find all messages in this chat to get their IDs
    // We only need the '_id' field
    const messages = await messageModel.find({ chat: chatId }).select("_id");
    
    // Convert objects to an array of strings: ['id1', 'id2', ...]
    const messageIds = messages.map((msg) => msg._id.toString());

    // 3. Delete vectors from Pinecone using the IDs
    // (Do this BEFORE deleting from Mongo so we still have the IDs)
    if (messageIds.length > 0) {
      await deleteChatMemory(messageIds);
    }

    // 4. Delete Chat and Messages from MongoDB
    await chatModel.deleteOne({ _id: chatId });
    await messageModel.deleteMany({ chat: chatId });

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Error deleting chat" });
  }
};

module.exports = { createChatController , getAllChatsController,deleteChatController};
