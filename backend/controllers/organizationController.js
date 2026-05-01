const { StatusCodes } = require('http-status-codes');

const ComplianceRule = require('../models/ComplianceRule');
const Organization = require('../models/Organization');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { sanitizeObject, sanitizeText } = require('../utils/sanitize');
const { createAuditLog } = require('../services/auditService');

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const onboardOrganization = async (req, res) => {
  const payload = sanitizeObject(req.body);
  const slug = slugify(payload.organizationName);

  const existing = await Organization.findOne({ slug }).lean();
  if (existing) {
    throw new AppError('An organization with this name already exists', StatusCodes.CONFLICT);
  }

  const organization = await Organization.create({
    name: payload.organizationName,
    slug,
    type: payload.organizationType || 'institution',
    industry: payload.industry,
    sizeBand: payload.sizeBand || '51-200',
    contactEmail: payload.adminEmail,
    contactPhone: payload.adminPhone,
    departments: (payload.departments || []).map((name) => ({ name })),
  });

  const subscription = await Subscription.create({
    organizationId: organization._id,
    planName: 'Trial',
    status: 'trial',
    billingCycle: 'monthly',
    seatLimit: 15,
    aiTokenLimit: 150000,
    renewalDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });

  const adminUser = await User.create({
    name: payload.adminName,
    email: payload.adminEmail,
    phone: payload.adminPhone,
    password: payload.adminPassword,
    role: 'org_admin',
    organizationId: organization._id,
  });

  organization.adminUserId = adminUser._id;
  organization.subscriptionId = subscription._id;
  await organization.save();

  await createAuditLog({
    actorUserId: adminUser._id,
    actorRole: adminUser.role,
    organizationId: organization._id,
    module: 'organization',
    action: 'onboard',
    targetType: 'organization',
    targetId: organization._id,
    metadata: { subscriptionId: subscription._id },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  const baselineRules = await ComplianceRule.find({ organizationId: null, isSystem: true }).lean();
  if (baselineRules.length) {
    await ComplianceRule.insertMany(
      baselineRules.map((rule) => ({
        code: rule.code,
        title: rule.title,
        category: rule.category,
        description: rule.description,
        severity: rule.severity,
        keywords: rule.keywords,
        responseGuidance: rule.responseGuidance,
        escalationGuidance: rule.escalationGuidance,
        evidenceHints: rule.evidenceHints,
        slaHours: rule.slaHours,
        isSystem: false,
        organizationId: organization._id,
      })),
    );
  }

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Organization onboarding submitted',
    organization,
    adminUserId: adminUser._id,
  });
};

const listPublicOrganizations = async (_req, res) => {
  const organizations = await Organization.find({ status: 'approved' })
    .select('name slug type industry departments branding')
    .sort({ name: 1 })
    .lean();

  res.status(StatusCodes.OK).json({
    success: true,
    organizations,
  });
};

const listOrganizations = async (req, res) => {
  const filter = req.user.role === 'super_admin' ? {} : { _id: req.user.organizationId };
  const organizations = await Organization.find(filter).sort({ createdAt: -1 }).lean();

  res.status(StatusCodes.OK).json({
    success: true,
    organizations,
  });
};

const getOrganization = async (req, res) => {
  const organization = await Organization.findById(req.params.organizationId).lean();

  if (!organization) {
    throw new AppError('Organization not found', StatusCodes.NOT_FOUND);
  }

  if (
    req.user.role !== 'super_admin' &&
    String(req.user.organizationId) !== String(organization._id)
  ) {
    throw new AppError('Organization access denied', StatusCodes.FORBIDDEN);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    organization,
  });
};

const updateOrganization = async (req, res) => {
  const payload = sanitizeObject(req.body);
  const organization = await Organization.findById(req.params.organizationId);

  if (!organization) {
    throw new AppError('Organization not found', StatusCodes.NOT_FOUND);
  }

  if (
    req.user.role !== 'super_admin' &&
    String(req.user.organizationId) !== String(organization._id)
  ) {
    throw new AppError('Organization access denied', StatusCodes.FORBIDDEN);
  }

  Object.assign(organization, {
    name: payload.name || organization.name,
    type: payload.type || organization.type,
    industry: payload.industry || organization.industry,
    contactEmail: payload.contactEmail || organization.contactEmail,
    contactPhone: payload.contactPhone || organization.contactPhone,
    notes: payload.notes || organization.notes,
    branding: {
      ...organization.branding,
      ...(payload.branding || {}),
    },
  });

  await organization.save();

  await createAuditLog({
    actorUserId: req.user._id,
    actorRole: req.user.role,
    organizationId: organization._id,
    module: 'organization',
    action: 'update',
    targetType: 'organization',
    targetId: organization._id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(StatusCodes.OK).json({
    success: true,
    organization,
  });
};

const updateOrganizationStatus = async (req, res) => {
  const { status } = sanitizeObject(req.body);
  const organization = await Organization.findById(req.params.organizationId);

  if (!organization) {
    throw new AppError('Organization not found', StatusCodes.NOT_FOUND);
  }

  organization.status = status;
  if (status === 'approved') {
    organization.approvedAt = new Date();
    organization.approvedBy = req.user._id;
  }
  await organization.save();

  res.status(StatusCodes.OK).json({
    success: true,
    organization,
  });
};

const addDepartment = async (req, res) => {
  const organization = await Organization.findById(req.params.organizationId);

  if (!organization) {
    throw new AppError('Organization not found', StatusCodes.NOT_FOUND);
  }

  if (
    req.user.role !== 'super_admin' &&
    String(req.user.organizationId) !== String(organization._id)
  ) {
    throw new AppError('Organization access denied', StatusCodes.FORBIDDEN);
  }

  organization.departments.push({
    name: sanitizeText(req.body.name),
    code: sanitizeText(req.body.code),
  });
  await organization.save();

  res.status(StatusCodes.CREATED).json({
    success: true,
    departments: organization.departments,
  });
};

module.exports = {
  addDepartment,
  getOrganization,
  listOrganizations,
  listPublicOrganizations,
  onboardOrganization,
  updateOrganization,
  updateOrganizationStatus,
};
