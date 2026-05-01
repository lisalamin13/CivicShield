const express = require('express');

const {
  assignReport,
  createComplianceRule,
  createReport,
  deleteComplianceRule,
  exportReportsCsv,
  exportReportsPdf,
  getReport,
  getReportAnalytics,
  listComplianceRules,
  listMessages,
  listReports,
  postMessage,
  trackReport,
  updateComplianceRule,
  updateStatus,
  uploadEvidence,
} = require('../controllers/reportController');
const { authorize, optionalAuth, protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const {
  assignValidator,
  complianceRuleValidator,
  createReportValidator,
  messageValidator,
  statusValidator,
  trackReportValidator,
} = require('../validators/reportValidators');

const router = express.Router();

router.post('/', optionalAuth, createReportValidator, validate, createReport);
router.post('/track', trackReportValidator, validate, trackReport);
router.get(
  '/',
  protect,
  authorize('super_admin', 'org_admin', 'investigator', 'staff', 'reporter'),
  listReports,
);
router.get(
  '/analytics/overview',
  protect,
  authorize('super_admin', 'org_admin', 'investigator', 'staff'),
  getReportAnalytics,
);
router.get(
  '/export/csv',
  protect,
  authorize('super_admin', 'org_admin', 'investigator', 'staff'),
  exportReportsCsv,
);
router.get(
  '/export/pdf',
  protect,
  authorize('super_admin', 'org_admin', 'investigator', 'staff'),
  exportReportsPdf,
);
router.get(
  '/compliance/rules',
  protect,
  authorize('super_admin', 'org_admin', 'investigator', 'staff'),
  listComplianceRules,
);
router.post(
  '/compliance/rules',
  protect,
  authorize('super_admin', 'org_admin'),
  complianceRuleValidator,
  validate,
  createComplianceRule,
);
router.patch(
  '/compliance/rules/:ruleId',
  protect,
  authorize('super_admin', 'org_admin'),
  updateComplianceRule,
);
router.delete(
  '/compliance/rules/:ruleId',
  protect,
  authorize('super_admin', 'org_admin'),
  deleteComplianceRule,
);
router.get(
  '/:reportId',
  protect,
  authorize('super_admin', 'org_admin', 'investigator', 'staff', 'reporter'),
  getReport,
);
router.patch(
  '/:reportId/status',
  protect,
  authorize('super_admin', 'org_admin', 'investigator', 'staff'),
  statusValidator,
  validate,
  updateStatus,
);
router.patch(
  '/:reportId/assign',
  protect,
  authorize('super_admin', 'org_admin', 'investigator', 'staff'),
  assignValidator,
  validate,
  assignReport,
);
router.get('/:reportId/messages', optionalAuth, listMessages);
router.post('/:reportId/messages', optionalAuth, messageValidator, validate, postMessage);
router.post('/:reportId/evidence', optionalAuth, upload.single('file'), uploadEvidence);

module.exports = router;
