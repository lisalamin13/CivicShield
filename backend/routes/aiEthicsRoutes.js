const express = require('express');
const router = express.Router();
const { consultAdvisor } = require('../controllers/aiEthicsController');
const organizationMiddleware = require('../middleware/organization');

// Apply middleware to extract x-organization-id [cite: 319, 622]
router.post('/consult', organizationMiddleware, consultAdvisor);

module.exports = router;