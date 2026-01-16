const messageModel=require("../models/aiMessage.model");

const getMessagesController = async (req, res) => {
  const { chatId } = req.params;
  try {
    const messages = await messageModel
      .find({ chat: chatId })
      .sort({ createdAt: 1 }); // Oldest first (for chat history flow)

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" });
  }
};


module.exports = { getMessagesController };