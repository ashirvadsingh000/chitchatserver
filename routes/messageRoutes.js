const express = require("express");
const router = express.Router();
const { getGlobalMessages, getPrivateMessages, getGhostMessages } = require("../controllers/messageController");

// GET /api/messages/global - fetch all global chat messages
router.get("/global", getGlobalMessages);

// GET /api/messages/private - fetch private messages between two users
router.get("/private", getPrivateMessages);

// GET /api/messages/ghost - fetch all ghost messages
router.get("/ghost", getGhostMessages);

module.exports = router;
