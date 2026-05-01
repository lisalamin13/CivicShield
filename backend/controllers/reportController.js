const path = require('node:path');

const { StatusCodes } = require('http-status-codes');
const { nanoid } = require('nanoid');

const ChatMessage = require('../models/ChatMessage');
const ComplianceRule = require('../models/ComplianceRule');
const EvidenceFile = require('../models/EvidenceFile');
const Organization = require('../models/Organization');
const Report = require('../models/Report');
const ReportStatusHistory = require('../models/ReportStatusHistory');
const User = require('../models/User');
const { analyzeReport } = require('../services/aiService');
const { getOrganizationOverview } = require('../services/analyticsService');
const { createAuditLog } = require('../services/auditService');
const { buildReportsCsv, buildReportsPdf } = require('../services/exportService');
const { scrubUploadedFile } = require('../services/metadataService');
const { uploadBuffer } = require('../services/storageService');
const AppError = require('../utils/appError');
const { decryptText, encryptText, generateRandomToken, hashValue } = require('../utils/crypto');
const { sanitizeObject } = require('../utils/sanitize');

const serializeReport = (report) => ({
  id: report._id,
  organizationId: report.organizationId,
  reporterUserId: report.reporterUserId,
  trackingCode: report.trackingCode,
  anonymous: report.anonymous,
  subject: report.subject,
  category: report.category,
  department: report.department,
  incidentDate: report.incidentDate,
  location: report.location,
  narrative: decryptText(report.narrativeEncrypted),
  reporterEmail: decryptText(report.reporterEmailEncrypted),
  reporterPhone: decryptText(report.reporterPhoneEncrypted),
  status: report.status,
  priority: report.priority,
  assignedTo: report.assignedTo,
  assignedDepartment: report.assignedDepartment,
  resolutionSummary: report.resolutionSummary,
  aiSummary: report.aiSummary,
  aiSentiment: report.aiSentiment,
  aiUrgency: report.aiUrgency,
  aiRiskScore: report.aiRiskScore,
  aiTags: report.aiTags,
  evidenceCount: report.evidenceCount,
  replyCount: report.replyCount,
  lastActivityAt: report.lastActivityAt,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
});

const serializeMessage = (message) => ({
  id: message._id,
  senderType: message.senderType,
  senderUserId: message.senderUserId,
  body: decryptText(message.bodyEncrypted),
  visibleToReporter: message.visibleToReporter,
  createdAt: message.createdAt,
});

const assertOrganizationAccess = async (req, organizationId) => {
  if (req.user?.role === 'super_admin') {
    return;
  }

  if (req.user?.organizationId && String(req.user.organizationId) === String(organizationId)) {
    return;
  }

  throw new AppError('Organization access denied', StatusCodes.FORBIDDEN);
};

const assertUserCanAccessReport = async (req, report) => {
  if (req.user.role === 'reporter') {
    if (String(report.reporterUserId) !== String(req.user._id)) {
      throw new AppError('Report access denied', StatusCodes.FORBIDDEN);
    }
    return;
  }

  await assertOrganizationAccess(req, report.organizationId);
};

const assertAnonymousAccess = async (reportId, accessKey) => {
  const report = await Report.findById(reportId).select('+accessKeyHash');

  if (!report) {
    throw new AppError('Report not found', StatusCodes.NOT_FOUND);
  }

  if (report.accessKeyHash !== hashValue(accessKey)) {
    throw new AppError('Invalid tracking credentials', StatusCodes.FORBIDDEN);
  }

  return report;
};

const createReport = async (req, res) => {
  const payload = sanitizeObject(req.body);
  const organization = await Organization.findById(payload.organizationId);

  if (!organization || organization.status !== 'approved') {
    throw new AppError('Organization is not available for reporting', StatusCodes.BAD_REQUEST);
  }

  if (
    req.user &&
    req.user.role !== 'super_admin' &&
    req.user.organizationId &&
    String(req.user.organizationId) !== String(organization._id)
  ) {
    throw new AppError('You can only submit reports within your organization', StatusCodes.FORBIDDEN);
  }

  const trackingCode = `CS-${nanoid(10).toUpperCase()}`;
  const accessKey = generateRandomToken(4).slice(0, 8).toUpperCase();

  const report = await Report.create({
    organizationId: organization._id,
    reporterUserId: req.user?._id || null,
    trackingCode,
    accessKeyHash: hashValue(accessKey),
    anonymous: payload.anonymous !== false,
    subject: payload.subject,
    category: payload.category || 'unclassified',
    department: payload.department,
    incidentDate: payload.incidentDate,
    location: payload.location,
    narrativeEncrypted: encryptText(payload.narrative),
    reporterEmailEncrypted: encryptText(payload.reporterEmail),
    reporterPhoneEncrypted: encryptText(payload.reporterPhone),
    metadata: {
      submissionChannel: 'web',
      sourceIpHash: hashValue(req.ip),
      userAgentHash: hashValue(req.headers['user-agent'] || 'unknown'),
    },
  });

  await ReportStatusHistory.create({
    organizationId: organization._id,
    reportId: report._id,
    previousStatus: null,
    newStatus: report.status,
    changedByUserId: req.user?._id || null,
    note: 'Report submitted',
  });

  if (organization.complianceSettings?.autoAiClassification) {
    const intelligence = await analyzeReport({
      report: { subject: payload.subject, department: payload.department, narrative: payload.narrative },
      organizationId: organization._id,
      userId: req.user?._id || null,
    });

    report.aiSummary = intelligence.summary;
    report.aiSentiment = intelligence.sentiment;
    report.aiUrgency = intelligence.urgency;
    report.aiRiskScore = intelligence.riskScore;
    report.aiTags = intelligence.tags;
    report.category = intelligence.category || report.category;
    report.priority =
      intelligence.riskScore >= 80 ? 'critical' : intelligence.riskScore >= 65 ? 'high' : 'medium';
    await report.save();
  }

  await createAuditLog({
    actorUserId: req.user?._id || null,
    actorRole: req.user?.role || 'anonymous',
    organizationId: organization._id,
    module: 'report',
    action: 'create',
    targetType: 'report',
    targetId: report._id,
    metadata: { trackingCode: report.trackingCode },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Report submitted successfully',
    trackingCode,
    accessKey,
    report: serializeReport(report),
  });
};

const listReports = async (req, res) => {
  const filter = {};

  if (req.user.role === 'reporter') {
    filter.reporterUserId = req.user._id;
  } else if (req.user.role !== 'super_admin') {
    filter.organizationId = req.user.organizationId;
  } else if (req.query.organizationId) {
    filter.organizationId = req.query.organizationId;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }
  if (req.query.category) {
    filter.category = req.query.category;
  }
  if (req.query.search) {
    filter.subject = { $regex: req.query.search, $options: 'i' };
  }

  const reports = await Report.find(filter)
    .populate('assignedTo', 'name role')
    .sort({ createdAt: -1 })
    .lean();

  res.status(StatusCodes.OK).json({
    success: true,
    reports: reports.map((report) => ({
      ...report,
      narrative: undefined,
      reporterEmail: undefined,
      reporterPhone: undefined,
    })),
  });
};

const getReport = async (req, res) => {
  const report = await Report.findById(req.params.reportId).populate('assignedTo', 'name role').lean();

  if (!report) {
    throw new AppError('Report not found', StatusCodes.NOT_FOUND);
  }

  await assertUserCanAccessReport(req, report);

  res.status(StatusCodes.OK).json({
    success: true,
    report: serializeReport(report),
  });
};

const trackReport = async (req, res) => {
  const payload = sanitizeObject(req.body);
  const report = await Report.findOne({ trackingCode: payload.trackingCode }).select('+accessKeyHash');

  if (!report || report.accessKeyHash !== hashValue(payload.accessKey)) {
    throw new AppError('Tracking code or access key is invalid', StatusCodes.UNAUTHORIZED);
  }

  const [messages, evidence] = await Promise.all([
    ChatMessage.find({ reportId: report._id, visibleToReporter: true }).sort({ createdAt: 1 }).lean(),
    EvidenceFile.find({ reportId: report._id }).sort({ createdAt: -1 }).lean(),
  ]);

  res.status(StatusCodes.OK).json({
    success: true,
    report: serializeReport(report),
    messages: messages.map(serializeMessage),
    evidence,
  });
};

const updateStatus = async (req, res) => {
  const payload = sanitizeObject(req.body);
  const report = await Report.findById(req.params.reportId);

  if (!report) {
    throw new AppError('Report not found', StatusCodes.NOT_FOUND);
  }

  await assertOrganizationAccess(req, report.organizationId);

  const previousStatus = report.status;
  report.status = payload.status;
  report.resolutionSummary = payload.resolutionSummary || report.resolutionSummary;
  report.lastActivityAt = new Date();
  await report.save();

  await ReportStatusHistory.create({
    organizationId: report.organizationId,
    reportId: report._id,
    previousStatus,
    newStatus: report.status,
    changedByUserId: req.user._id,
    note: payload.note,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    report: serializeReport(report),
  });
};

const assignReport = async (req, res) => {
  const payload = sanitizeObject(req.body);
  const report = await Report.findById(req.params.reportId);

  if (!report) {
    throw new AppError('Report not found', StatusCodes.NOT_FOUND);
  }

  await assertOrganizationAccess(req, report.organizationId);

  if (payload.assignedTo) {
    const assignee = await User.findById(payload.assignedTo).lean();
    if (!assignee) {
      throw new AppError('Assignee not found', StatusCodes.NOT_FOUND);
    }
    report.assignedTo = assignee._id;
  }

  if (payload.assignedDepartment) {
    report.assignedDepartment = payload.assignedDepartment;
  }

  report.lastActivityAt = new Date();
  await report.save();

  res.status(StatusCodes.OK).json({
    success: true,
    report: serializeReport(report),
  });
};

const postMessage = async (req, res) => {
  const payload = sanitizeObject(req.body);
  let report;
  let senderType;
  let senderUserId = null;

  if (req.user) {
    report = await Report.findById(req.params.reportId);
    if (!report) {
      throw new AppError('Report not found', StatusCodes.NOT_FOUND);
    }
    await assertUserCanAccessReport(req, report);
    senderUserId = req.user._id;
    senderType =
      req.user.role === 'org_admin'
        ? 'org_admin'
        : req.user.role === 'investigator'
          ? 'investigator'
          : 'reporter';
  } else {
    report = await assertAnonymousAccess(req.params.reportId, payload.accessKey);
    senderType = 'anonymous_reporter';
  }

  const message = await ChatMessage.create({
    organizationId: report.organizationId,
    reportId: report._id,
    senderType,
    senderUserId,
    bodyEncrypted: encryptText(payload.message),
    visibleToReporter: true,
  });

  report.replyCount += 1;
  report.lastActivityAt = new Date();
  await report.save();

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: serializeMessage(message),
  });
};

const listMessages = async (req, res) => {
  let report;

  if (req.user) {
    report = await Report.findById(req.params.reportId);
    if (!report) {
      throw new AppError('Report not found', StatusCodes.NOT_FOUND);
    }
    await assertUserCanAccessReport(req, report);
  } else {
    report = await assertAnonymousAccess(req.params.reportId, req.query.accessKey);
  }

  const filter = { reportId: report._id };
  if (!req.user) {
    filter.visibleToReporter = true;
  }

  const messages = await ChatMessage.find(filter).sort({ createdAt: 1 }).lean();

  res.status(StatusCodes.OK).json({
    success: true,
    messages: messages.map(serializeMessage),
  });
};

const uploadEvidence = async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', StatusCodes.BAD_REQUEST);
  }

  const payload = sanitizeObject(req.body);
  let report;
  let uploadedByUserId = null;
  let uploadedByAnonymous = false;

  if (req.user) {
    report = await Report.findById(req.params.reportId);
    if (!report) {
      throw new AppError('Report not found', StatusCodes.NOT_FOUND);
    }
    await assertUserCanAccessReport(req, report);
    uploadedByUserId = req.user._id;
  } else {
    report = await assertAnonymousAccess(req.params.reportId, payload.accessKey);
    uploadedByAnonymous = true;
  }

  const scrubbedFile = await scrubUploadedFile(req.file);
  const safeFilename = `${Date.now()}-${nanoid(6)}${path.extname(req.file.originalname)}`;
  const uploaded = await uploadBuffer({
    buffer: scrubbedFile.buffer,
    filename: safeFilename,
    folder: `reports/${report.organizationId}`,
  });

  const evidence = await EvidenceFile.create({
    organizationId: report.organizationId,
    reportId: report._id,
    uploadedByUserId,
    uploadedByAnonymous,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: scrubbedFile.buffer.length,
    storageProvider: uploaded.provider,
    storagePath: uploaded.path,
    url: uploaded.url,
    scrubbed: scrubbedFile.scrubbed,
    scrubNotes: scrubbedFile.scrubNotes,
  });

  report.evidenceCount += 1;
  report.lastActivityAt = new Date();
  await report.save();

  res.status(StatusCodes.CREATED).json({
    success: true,
    evidence,
  });
};

const getReportAnalytics = async (req, res) => {
  const organizationId =
    req.user.role === 'super_admin' ? req.query.organizationId : req.user.organizationId;

  if (!organizationId) {
    throw new AppError('organizationId is required', StatusCodes.BAD_REQUEST);
  }

  const overview = await getOrganizationOverview(organizationId);

  res.status(StatusCodes.OK).json({
    success: true,
    analytics: overview,
  });
};

const exportReportsCsv = async (req, res) => {
  const filter = req.user.role === 'super_admin' && req.query.organizationId
    ? { organizationId: req.query.organizationId }
    : { organizationId: req.user.organizationId };
  const reports = await Report.find(filter).sort({ createdAt: -1 }).lean();
  const csv = buildReportsCsv(reports);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="civicshield-reports.csv"');
  res.status(StatusCodes.OK).send(csv);
};

const exportReportsPdf = async (req, res) => {
  const filter = req.user.role === 'super_admin' && req.query.organizationId
    ? { organizationId: req.query.organizationId }
    : { organizationId: req.user.organizationId };
  const reports = await Report.find(filter).sort({ createdAt: -1 }).lean();
  const pdfBuffer = await buildReportsPdf(reports);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="civicshield-reports.pdf"');
  res.status(StatusCodes.OK).send(pdfBuffer);
};

const listComplianceRules = async (req, res) => {
  const organizationId =
    req.user.role === 'super_admin' ? req.query.organizationId || null : req.user.organizationId;
  const query =
    req.user.role === 'super_admin' && !organizationId
      ? {}
      : { $or: [{ organizationId }, { organizationId: null }] };
  const rules = await ComplianceRule.find(query).sort({ isSystem: -1, category: 1 }).lean();

  res.status(StatusCodes.OK).json({
    success: true,
    rules,
  });
};

const createComplianceRule = async (req, res) => {
  const payload = sanitizeObject(req.body);
  const organizationId =
    req.user.role === 'super_admin' ? payload.organizationId || null : req.user.organizationId;

  const rule = await ComplianceRule.create({
    organizationId,
    code: payload.code,
    title: payload.title,
    category: payload.category,
    description: payload.description,
    severity: payload.severity,
    keywords: payload.keywords || [],
    responseGuidance: payload.responseGuidance,
    escalationGuidance: payload.escalationGuidance,
    evidenceHints: payload.evidenceHints || [],
    slaHours: payload.slaHours || 72,
    isSystem: req.user.role === 'super_admin' && !organizationId,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    rule,
  });
};

const updateComplianceRule = async (req, res) => {
  const payload = sanitizeObject(req.body);
  const rule = await ComplianceRule.findById(req.params.ruleId);

  if (!rule) {
    throw new AppError('Compliance rule not found', StatusCodes.NOT_FOUND);
  }

  if (
    req.user.role !== 'super_admin' &&
    String(rule.organizationId) !== String(req.user.organizationId)
  ) {
    throw new AppError('Compliance rule access denied', StatusCodes.FORBIDDEN);
  }

  Object.assign(rule, {
    code: payload.code || rule.code,
    title: payload.title || rule.title,
    category: payload.category || rule.category,
    description: payload.description || rule.description,
    severity: payload.severity || rule.severity,
    keywords: payload.keywords || rule.keywords,
    responseGuidance: payload.responseGuidance || rule.responseGuidance,
    escalationGuidance: payload.escalationGuidance || rule.escalationGuidance,
    evidenceHints: payload.evidenceHints || rule.evidenceHints,
    slaHours: payload.slaHours || rule.slaHours,
    isActive: payload.isActive ?? rule.isActive,
  });
  await rule.save();

  res.status(StatusCodes.OK).json({
    success: true,
    rule,
  });
};

const deleteComplianceRule = async (req, res) => {
  const rule = await ComplianceRule.findById(req.params.ruleId);

  if (!rule) {
    throw new AppError('Compliance rule not found', StatusCodes.NOT_FOUND);
  }

  if (
    req.user.role !== 'super_admin' &&
    String(rule.organizationId) !== String(req.user.organizationId)
  ) {
    throw new AppError('Compliance rule access denied', StatusCodes.FORBIDDEN);
  }

  await rule.deleteOne();

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Compliance rule deleted',
  });
};

module.exports = {
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
};
