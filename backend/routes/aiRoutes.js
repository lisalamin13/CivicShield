const express = require('express');
const router = express.Router();
const { getEthicsAdvice } = require('../controllers/aiController');

router.post('/advise', getEthicsAdvice);
router.post('/analyze', getEthicsAdvice);

module.exports = router;
