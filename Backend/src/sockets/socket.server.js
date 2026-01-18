const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const cookie = require("cookie");
const userModel = require("../models/user.model");
const { generateResponse, generateVector } = require("../services/ai.service");
const messageModel = require("../models/aiMessage.model");
const { createMemory, queryMemory } = require("../services/vector.service");

const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174"], // Ensure your frontend URL is here
      credentials: true,
    },
  });

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
      try {
        // 1. Save user message to DB
        const message = await messageModel.create({
          content: messagePayload.content,
          user: socket.user._id,
          chat: messagePayload.chat,
          role: "user",
        });

        // 2. Generate vector
        const vector = await generateVector(messagePayload.content);

        // 3. Query similar memories
        const memory = await queryMemory({
          queryVector: vector,
          metadata: {
            user: socket.user._id,
          },
          limit: 3,
        });

        // 4. Save user message to Vector DB
        await createMemory({
          vectors: vector,
          metadata: {
            chat: messagePayload.chat,
            user: socket.user._id,
            text: messagePayload.content,
          },
          messageID: message._id,
        });

        // 5. Fetch chat history (Last 3 messages)
        const chatHistory = (
          await messageModel
            .find({
              chat: messagePayload.chat,
            })
            .sort({ createdAt: -1 })
            .limit(3)
            .lean()
        ).reverse();

        // 6. Create Short Term Memory
        const shortTermMemory = chatHistory.map((item) => {
          return {
            role: item.role,
            parts: [{ text: item.content }],
          };
        });

        // 7. Create Long Term Memory (FIXED SYNTAX ERROR HERE)
        const longTermMemory = [
          {
            role: "user",
            parts: [
              {
                // CHANGED: Removed "three messages" and added instruction to use it as context
                text: `Here is some relevant context from previous conversations. 
                Use this context to answer the user if relevant, 
                but do not explicitly mention that you are reading from a history file:\n\n${memory
                  .map((item) => item.metadata.text)
                  .join("\n")}`,// to join("\n") for better readability
              },
            ],
          },
        ];

        // 8. Generate AI Response
        const response = await generateResponse([
          ...longTermMemory,
          ...shortTermMemory,
        ]);

        // 9. Save AI Response to DB
        const responseMessage = await messageModel.create({
          content: response,
          user: socket.user._id,
          chat: messagePayload.chat,
          role: "model",
        });

        // 10. Vectorize and Save AI Response
        const responseVector = await generateVector(responseMessage.content);

        await createMemory({
          vectors: responseVector,
          metadata: {
            chat: messagePayload.chat,
            user: socket.user._id,
            text: response,
          },
          messageID: responseMessage._id,
        });

        // 11. Send back to client
        socket.emit("ai-message-response", {
          content: response,
          chat: messagePayload.chat,
        });
      } catch (error) {
        console.error("Error in ai-message handler:", error);
        // Optional: Emit error to client so they know something went wrong
        // socket.emit("error", "Something went wrong processing your message");
      }
    });
    // --- END OF YOUR CODE ---
  });
};

module.exports = initSocketServer;
