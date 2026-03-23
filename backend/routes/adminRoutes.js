const express = require('express');
const router = express.Router();
const { getAdminReports, getSingleReport } = require('../controllers/adminController');
const { protect } = require('../controller/auth');
const organizationMiddleware = require('../middleware/organization');

// Apply both: Check for Token AND Organization ID 
router.use(protect);
router.use(organizationMiddleware);

router.get('/reports', getAdminReports);
router.get('/reports/:id', getSingleReport);

module.exports = router;