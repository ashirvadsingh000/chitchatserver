const express = require('express');
const { sendFeedback } = require('../controllers/feedbackController');

const router = express.Router();

// POST route for sending feedback
router.post('/send', sendFeedback);

module.exports = router;
