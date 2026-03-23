const express = require('express');
const router = express.Router();
const {submitReport, getOrgReports, getReportStatus, getAdminAnalytics} = require('../controllers/reportsController');
const organizationMiddleware = require('../middleware/organization');

const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/' });

router.use(organizationMiddleware);

router.post('/', submitReport);
router.get('/analytics', getAdminAnalytics);
router.get('/:trackingId', getReportStatus);

router.post('/', upload.single('evidence'), submitReport);

module.exports = router;