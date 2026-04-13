const express = require('express');
const router = express.Router();

const { getAdminReports, getSingleReport } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('SuperAdmin', 'SUPER_ADMIN', 'OrgAdmin', 'DeptHead', 'Admin', 'Investigator', 'Compliance_Officer'));

router.get('/reports', getAdminReports);
router.get('/reports/:id', getSingleReport);

module.exports = router;
