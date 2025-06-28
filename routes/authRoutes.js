const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Register route
router.post("/register", async (req, res) => {
  try {
    const { avatar, username, password, description } = req.body;

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const newUser = await User.create({ avatar, username, password, description });
    res.status(201).json({ message: "Registered", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { avatar, username, password } = req.body;

    const user = await User.findOne({ username, avatar });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login success", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User search route
router.get("/search", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: "Username query is required" });

    const regex = new RegExp(username, "i"); // case-insensitive search
    const users = await User.find({ username: regex }).select("avatar username description");

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
