const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const cookie = require("cookie");
const userModel = require("../models/user.model");
const { generateResponse, generateVector } = require("../services/ai.service");
const messageModel = require("../models/aiMessage.model");
const { createMemory, queryMemory } = require("../services/vector.service");

const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {});

  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
    const token = cookies.token;

    if (!token) {
      return next(new Error("No token Provided Authentication error"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await userModel.findById(decoded.id);
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });
  io.on("connection", (socket) => {
    socket.on("ai-message", async (messagePayload) => {

      const [message, vector] = await Promise.all([
        messageModel.create({
          content: messagePayload.content,
          user: socket.user._id,
          chat: messagePayload.chat,
          role: "user",
        }),
        generateVector(messagePayload.content)
      ]);

      await createMemory({
          vectors: vector,
          metadata: {
            chat: messagePayload.chat,
            user: socket.user._id,
            text: messagePayload.content,
          },
          messageID: message._id,
        });

      const [memory, chatHistory] = await Promise.all([
        queryMemory({
          queryVector: vector,
          metadata: {
            user: socket.user._id,
          },
          limit: 3,
        }),
        messageModel
          .find({
            chat: messagePayload.chat,
          })
          .sort({ createdAt: -1 })
          .limit(3)
          .lean(),
      ]);

      // short term memory is created from the chat history

      const shortTermMemory = chatHistory.map((item) => {
        return {
          role: item.role,
          parts: [
            {
              text: item.content,
            },
          ],
        };
      });

      // long term memory is created by using the memory from the vector database

      const longTermMemory = [
        {
          role: "user",
          parts: [
            {
              text: `These are some last three messages from the chat use them to generate response
              ${memory.map((item) => item.metadata.text).join("\n ")}
              
              `,
            },
          ],
        },
      ];

      // response is generated from the ai model using long term memory and short term memory

      const response = await generateResponse([
        ...longTermMemory,
        ...shortTermMemory,
      ]);

       // ai response is sent back to the user

      socket.emit("ai-message-response", {
        content: response,
        chat: messagePayload.chat,
      });

      const [responseMessage, responseVector] = await Promise.all([
        messageModel.create({
          content: response,
          user: socket.user._id,
          chat: messagePayload.chat,
          role: "model",
        }),
        generateVector(response),
      ]);

      // ai response vector is saved in the vector database

      await createMemory({
        vectors: responseVector,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
          text: response,
        },
        messageID: responseMessage._id,
      });

    });
  });
};
module.exports = initSocketServer;
