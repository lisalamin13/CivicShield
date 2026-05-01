const { StatusCodes } = require('http-status-codes');

const AIUsageLog = require('../models/AIUsageLog');
const Report = require('../models/Report');
const { analyzeReport, draftReply, ethicsChat } = require('../services/aiService');
const AppError = require('../utils/appError');
const { decryptText } = require('../utils/crypto');
const { sanitizeObject } = require('../utils/sanitize');

const chat = async (req, res) => {
  const payload = sanitizeObject(req.body);
  const organizationId = payload.organizationId || req.user?.organizationId || null;
  const result = await ethicsChat({
    organizationId,
    userId: req.user?._id || null,
    message: payload.message,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
};

const reportIntelligence = async (req, res) => {
  const report = await Report.findById(req.params.reportId);

  if (!report) {
    throw new AppError('Report not found', StatusCodes.NOT_FOUND);
  }

  if (
    req.user.role !== 'super_admin' &&
    String(req.user.organizationId) !== String(report.organizationId)
  ) {
    throw new AppError('Report access denied', StatusCodes.FORBIDDEN);
  }

  const intelligence = await analyzeReport({
    report: {
      subject: report.subject,
      department: report.department,
      narrative: decryptText(report.narrativeEncrypted),
    },
    organizationId: report.organizationId,
    userId: req.user._id,
  });

  report.aiSummary = intelligence.summary;
  report.aiSentiment = intelligence.sentiment;
  report.aiUrgency = intelligence.urgency;
  report.aiRiskScore = intelligence.riskScore;
  report.aiTags = intelligence.tags;
  report.category = intelligence.category || report.category;
  await report.save();

  res.status(StatusCodes.OK).json({
    success: true,
    intelligence,
  });
};

const draftReportReply = async (req, res) => {
  const report = await Report.findById(req.params.reportId);

  if (!report) {
    throw new AppError('Report not found', StatusCodes.NOT_FOUND);
  }

  if (
    req.user.role !== 'super_admin' &&
    String(req.user.organizationId) !== String(report.organizationId)
  ) {
    throw new AppError('Report access denied', StatusCodes.FORBIDDEN);
  }

  const result = await draftReply({
    report: {
      subject: report.subject,
      status: report.status,
      aiSummary: report.aiSummary,
    },
    organizationId: report.organizationId,
    userId: req.user._id,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
};

const getAIUsage = async (req, res) => {
  const filter =
    req.user.role === 'super_admin'
      ? req.query.organizationId
        ? { organizationId: req.query.organizationId }
        : {}
      : { organizationId: req.user.organizationId };

  const usage = await AIUsageLog.find(filter).sort({ createdAt: -1 }).limit(100).lean();

  res.status(StatusCodes.OK).json({
    success: true,
    usage,
  });
};

module.exports = {
  chat,
  draftReportReply,
  getAIUsage,
  reportIntelligence,
};
