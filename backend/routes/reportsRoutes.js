const express = require('express');
const router = express.Router();
const { 
    submitReport, 
    getReportStatus, 
    getAdminAnalytics, 
    getAdminReports // Add the new controller function we just discussed
} = require('../controllers/reportsController');
const organizationMiddleware = require('../middleware/organization');

const multer = require('multer');
// Temporary storage for Level 2: Whistleblower Core [cite: 533]
const upload = multer({ dest: 'uploads/temp/' });

// Apply organization middleware to all routes in this file [cite: 622]
router.use(organizationMiddleware);

// --- Whistleblower Routes ---

// GET: Track case status using 16-digit tracking ID [cite: 255, 423]
router.get('/status/:trackingId', getReportStatus);

// POST: Submit report with optional evidence [cite: 51, 53]
// 'evidence' must match the key used in your frontend/Postman
router.post('/', upload.single('evidence'), submitReport);


// --- Administrative Routes ---

// GET: Fetch all reports for the Admin Dashboard [cite: 303, 427]
router.get('/admin/all', getAdminReports);

// GET: Al-driven analytics and category urgency [cite: 65, 221]
router.get('/analytics', getAdminAnalytics);

module.exports = router;