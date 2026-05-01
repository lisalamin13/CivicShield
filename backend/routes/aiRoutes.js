const express = require('express');

const { chat, draftReportReply, getAIUsage, reportIntelligence } = require('../controllers/aiController');
const { authorize, optionalAuth, protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post('/chat', aiLimiter, optionalAuth, chat);
router.post(
  '/reports/:reportId/intelligence',
  aiLimiter,
  protect,
  authorize('super_admin', 'org_admin', 'investigator', 'staff'),
  reportIntelligence,
);
router.post(
  '/reports/:reportId/draft-reply',
  aiLimiter,
  protect,
  authorize('super_admin', 'org_admin', 'investigator', 'staff'),
  draftReportReply,
);
router.get(
  '/usage',
  protect,
  authorize('super_admin', 'org_admin', 'investigator', 'staff'),
  getAIUsage,
);

module.exports = router;
