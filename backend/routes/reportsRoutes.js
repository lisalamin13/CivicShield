const express = require('express');
const router = express.Router();
const multer = require('multer');

// 1. Import all necessary controllers (Added getReportDetails)
const { 
    submitReport, 
    getReportStatus, 
    getAdminAnalytics,
    getOrgReports,
    getReportDetails // Ensure this exists in your controller!
} = require('../controllers/reportsController');

// 2. Import Middlewares
const { protect } = require('../middleware/authMiddleware'); 
const auditLogger = require('../middleware/auditMiddleware');
const organizationMiddleware = require('../middleware/organization');

const upload = multer({ dest: 'uploads/temp/' });

// Apply organization middleware to all routes in this file
router.use(organizationMiddleware);

// --- ROUTES ---

// Public: Submit report with optional evidence
router.post('/', upload.single('evidence'), submitReport);

// Public: Whistleblower checks status via Tracking ID
router.get('/status/:trackingId', getReportStatus);

// Private: Admin Analytics (Added protect)
router.get('/analytics', protect, getAdminAnalytics);

// Private: List all reports (Added protect)
router.get('/admin/all', protect, auditLogger('VIEW_ALL_REPORTS'), getOrgReports);

// Private: View a specific report (Added protect and audit log)
router.get('/:reportId', 
    protect, 
    auditLogger('VIEW_SENSITIVE_REPORT'), 
    getReportDetails
);

module.exports = router;