const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  avatar: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  description: { type: String, required: true },
});

module.exports = mongoose.model("User", userSchema);
