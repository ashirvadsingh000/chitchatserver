const User = require("../models/User");


exports.changePassword = async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    console.log("ChangePassword request:", { username, oldPassword: "****", newPassword: "****" });

    const user = await User.findOne({ username });
    console.log("Fetched user for password change:", { username: user?.username, passwordExists: !!user?.password });
    if (!user) {
      console.log("User not found for username:", username);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Stored password hash:", user.password);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      console.log("Old password does not match for user:", username);
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    console.log("Password changed successfully for user:", username);

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const GhostMessage = require("../models/GhostMessage");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { avatar, username, password, description } = req.body;

  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: "Username exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ avatar, username, password: hashed, description });

    const ghost = await GhostMessage.findOne({ avatar, username, password, description });
    const ghostMessage = ghost ? ghost.message : null;

    if (ghost) await GhostMessage.deleteOne({ _id: ghost._id });

    res.status(201).json({ message: "Registered", ghostMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { avatar, username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || user.avatar !== avatar) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Fetch ghost messages for this user
    const ghostMessages = await GhostMessage.find({ username, password });

    // Delete fetched ghost messages
    await GhostMessage.deleteMany({ username, password });

    res.json({ token, user: { username, avatar, description: user.description }, ghostMessages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  try {
    const user = await User.findOne({ username });
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ message: "Wrong old password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
