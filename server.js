const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config");
const authRoutes = require("./routes/authRoutes");
const { Server } = require("socket.io");
const chatSocket = require("./sockets/chat");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // For dev, limit this in prod
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);

const messageRoutes = require("./routes/messageRoutes");
app.use("/api/messages", messageRoutes);

chatSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
