const mongoose = require("mongoose");

const ghostSchema = new mongoose.Schema({
  avatar: String,
  username: String,
  password: String,
  description: String,
  message: String,
  sentAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GhostMessage", ghostSchema);
