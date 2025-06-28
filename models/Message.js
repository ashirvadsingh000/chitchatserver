const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  type: { type: String, enum: ["global", "private"], required: true },
  from: String,
  to: String, // null for global
  content: String,
  fakeContent: String,
  isEncrypted: Boolean,
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date,
});

module.exports = mongoose.model("Message", messageSchema);
