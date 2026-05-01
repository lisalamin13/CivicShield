const { StatusCodes } = require('http-status-codes');

const SystemSetting = require('../models/SystemSetting');
const { createAuditLog } = require('../services/auditService');
const { sanitizeObject } = require('../utils/sanitize');

const getSystemSettings = async (_req, res) => {
  const settings =
    (await SystemSetting.findOne({ key: 'platform' }).lean()) ||
    (await SystemSetting.create({ key: 'platform' }));

  res.status(StatusCodes.OK).json({
    success: true,
    settings,
  });
};

const updateSystemSettings = async (req, res) => {
  const payload = sanitizeObject(req.body);

  const settings = await SystemSetting.findOneAndUpdate(
    { key: 'platform' },
    { ...payload, updatedBy: req.user._id },
    { new: true, upsert: true },
  );

  await createAuditLog({
    actorUserId: req.user._id,
    actorRole: req.user.role,
    module: 'settings',
    action: 'update',
    targetType: 'system_setting',
    targetId: settings._id,
    metadata: payload,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(StatusCodes.OK).json({
    success: true,
    settings,
  });
};

module.exports = {
  getSystemSettings,
  updateSystemSettings,
};
