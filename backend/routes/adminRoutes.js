const express = require('express');

const {
  listAbuseReports,
  listAuditLogs,
  listSubscriptions,
  platformOverview,
  tokenUsage,
  updateSubscription,
} = require('../controllers/adminController');
const { authorize, protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('super_admin'));

router.get('/platform-overview', platformOverview);
router.get('/abuse-reports', listAbuseReports);
router.get('/audit-logs', listAuditLogs);
router.get('/subscriptions', listSubscriptions);
router.patch('/subscriptions/:subscriptionId', updateSubscription);
router.get('/token-usage', tokenUsage);

module.exports = router;
