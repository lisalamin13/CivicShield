const express = require('express');
const multer = require('multer');

const {
    submitReport,
    getReportStatus,
    getAdminAnalytics,
    getOrgReports,
    getReportDetails
} = require('../controllers/reportsController');
const { protect, authorize } = require('../middleware/authMiddleware');
const auditLogger = require('../middleware/auditMiddleware');
const organizationMiddleware = require('../middleware/organization');

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

const adminRoles = [
    'SuperAdmin',
    'SUPER_ADMIN',
    'OrgAdmin',
    'DeptHead',
    'Admin',
    'Investigator',
    'Compliance_Officer'
];

router.post('/', organizationMiddleware, upload.single('evidence'), submitReport);
router.get('/status/:trackingId', organizationMiddleware, getReportStatus);

router.get('/analytics', protect, authorize(...adminRoles), getAdminAnalytics);
router.get('/admin/all', protect, authorize(...adminRoles), auditLogger('VIEW_ALL_REPORTS'), getOrgReports);
router.get(
    '/:reportId',
    protect,
    authorize(...adminRoles),
    auditLogger('VIEW_SENSITIVE_REPORT'),
    getReportDetails
);

module.exports = router;
