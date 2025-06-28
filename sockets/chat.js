const Message = require("../models/Message");
const User = require("../models/User");
const GhostMessage = require("../models/GhostMessage");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 User connected");

    socket.on("join", (username) => {
      socket.join(username);
      console.log(`User joined room: ${username}`);
    });

    socket.on("send-global", async (data) => {
      const msg = await Message.create({
        type: "global",
        from: data.from,
        content: data.content,
        fakeContent: data.fakeContent,
        isEncrypted: data.isEncrypted,
        expiresAt: data.expiresAt,
      });

      io.emit("receive-global", msg);
    });

    socket.on("send-private", async (data) => {
      try {
        const recipient = await User.findOne({ username: data.to });
        if (!recipient) {
          socket.emit("error-private", { message: `User '${data.to}' not found.` });
          return;
        }

        const msg = await Message.create({
          type: "private",
          from: data.from,
          to: data.to,
          content: data.content,
          isEncrypted: data.isEncrypted,
          expiresAt: data.expiresAt,
        });

        io.to(data.to).emit("receive-private", msg);

        // Schedule deletion from sender side after 2 minutes
        setTimeout(() => {
          io.to(data.from).emit("delete-private-message", msg._id);
          io.to(data.to).emit("delete-private-message", msg._id);
        }, 2 * 60 * 1000); // 2 minutes
      } catch (error) {
        console.error("Error sending private message:", error);
        socket.emit("error-private", { message: "Failed to send private message." });
      }
    });

  socket.on("message-read", async ({ messageId }) => {
    try {
      // Schedule deletion from database after 5 minutes
      setTimeout(async () => {
        await Message.findByIdAndDelete(messageId);
        io.emit("delete-private-message", messageId);
      }, 5 * 60 * 1000); // 5 minutes
    } catch (error) {
      console.error("Error deleting message after read:", error);
    }
  });

  // Handle sending ghost chat message
  socket.on("send-ghost", async (data) => {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ username: data.username });
      if (existingUser) {
        socket.emit("error-ghost", { message: "User already created" });
        return;
      }

      const ghostMsg = new GhostMessage({
        avatar: data.avatar,
        username: data.username,
        password: data.password,
        description: data.description,
        message: data.message,
      });
      await ghostMsg.save();

      // Emit to all clients or specific logic as needed
      io.emit("receive-ghost", ghostMsg);
    } catch (error) {
      console.error("Error sending ghost message:", error);
      socket.emit("error-ghost", { message: "Failed to send ghost message." });
    }
  });

    // New handler for deleting global message after 5 seconds
    socket.on("delete-global-message", async (msgId) => {
      setTimeout(async () => {
        try {
          await Message.findByIdAndDelete(msgId);
          io.emit("delete-global-message", msgId);
        } catch (error) {
          console.error("Error deleting global message:", error);
        }
      }, 5000);
    });

  socket.on("ghost-message-read", async ({ messageId }) => {
    try {
      // Schedule deletion from database after 1 minute
      setTimeout(async () => {
        await GhostMessage.findByIdAndDelete(messageId);
        io.emit("delete-ghost-message", messageId);
      }, 1 * 60 * 1000); // 1 minute
    } catch (error) {
      console.error("Error deleting ghost message after read:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
  });
};
