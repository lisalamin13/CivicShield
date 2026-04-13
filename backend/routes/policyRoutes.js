const express = require('express');
const router = express.Router();
const { addPolicy, getPolicies } = require('../controllers/policyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post(
    '/',
    protect,
    authorize('SuperAdmin', 'SUPER_ADMIN', 'OrgAdmin', 'DeptHead', 'Admin', 'Compliance_Officer'),
    addPolicy
);
router.get('/:orgId', getPolicies);

module.exports = router;
