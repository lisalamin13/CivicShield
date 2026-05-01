const { StatusCodes } = require('http-status-codes');

const AIUsageLog = require('../models/AIUsageLog');
const AuditLog = require('../models/AuditLog');
const Report = require('../models/Report');
const Subscription = require('../models/Subscription');
const { getPlatformOverview } = require('../services/analyticsService');
const AppError = require('../utils/appError');
const { sanitizeObject } = require('../utils/sanitize');

const platformOverview = async (_req, res) => {
  const overview = await getPlatformOverview();

  res.status(StatusCodes.OK).json({
    success: true,
    overview,
  });
};

const listAbuseReports = async (_req, res) => {
  const reports = await Report.find({ abuseFlagsCount: { $gt: 0 } })
    .sort({ abuseFlagsCount: -1, createdAt: -1 })
    .lean();

  res.status(StatusCodes.OK).json({
    success: true,
    reports,
  });
};

const listAuditLogs = async (req, res) => {
  const logs = await AuditLog.find({})
    .sort({ createdAt: -1 })
    .limit(Number(req.query.limit || 200))
    .lean();

  res.status(StatusCodes.OK).json({
    success: true,
    logs,
  });
};

const listSubscriptions = async (_req, res) => {
  const subscriptions = await Subscription.find({})
    .populate('organizationId', 'name slug status')
    .sort({ createdAt: -1 })
    .lean();

  res.status(StatusCodes.OK).json({
    success: true,
    subscriptions,
  });
};

const updateSubscription = async (req, res) => {
  const payload = sanitizeObject(req.body);
  const subscription = await Subscription.findById(req.params.subscriptionId);

  if (!subscription) {
    throw new AppError('Subscription not found', StatusCodes.NOT_FOUND);
  }

  Object.assign(subscription, {
    planName: payload.planName || subscription.planName,
    status: payload.status || subscription.status,
    billingCycle: payload.billingCycle || subscription.billingCycle,
    price: payload.price ?? subscription.price,
    seatLimit: payload.seatLimit ?? subscription.seatLimit,
    aiTokenLimit: payload.aiTokenLimit ?? subscription.aiTokenLimit,
    renewalDate: payload.renewalDate || subscription.renewalDate,
  });
  await subscription.save();

  res.status(StatusCodes.OK).json({
    success: true,
    subscription,
  });
};

const tokenUsage = async (_req, res) => {
  const usage = await AIUsageLog.aggregate([
    {
      $group: {
        _id: '$organizationId',
        totalTokens: { $sum: '$totalTokens' },
        requests: { $sum: 1 },
      },
    },
    { $sort: { totalTokens: -1 } },
  ]);

  res.status(StatusCodes.OK).json({
    success: true,
    usage,
  });
};

module.exports = {
  listAbuseReports,
  listAuditLogs,
  listSubscriptions,
  platformOverview,
  tokenUsage,
  updateSubscription,
};
