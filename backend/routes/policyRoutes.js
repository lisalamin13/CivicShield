const express = require('express');
const router = express.Router();
const { addPolicy, getPolicies } = require('../controllers/policyController');
const { protect } = require('../middleware/auth');

// Only admins can add policies, but anyone can view them
router.post('/', protect, addPolicy);
router.get('/:orgId', getPolicies);

module.exports = router;