const express = require('express');
const router = express.Router();
const { getEthicsAdvice } = require('../controllers/aiController');

// This can be public so reporters can get advice while typing
router.post('/advise', getEthicsAdvice);

module.exports = router;