const express = require('express');
const router = express.Router();
const { sendMessage, getChatHistory } = require('../controllers/conversationController');
const { protect } = require('../middleware/auth'); // Ensure only authorized staff/users access this

// POST /api/v1/conversations/send
router.post('/send', sendMessage);

// GET /api/v1/conversations/:reportId
router.get('/:reportId', getChatHistory);

module.exports = router;