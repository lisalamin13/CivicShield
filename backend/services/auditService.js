const AuditLog = require('../models/AuditLog');
const { hashValue } = require('../utils/crypto');

const createAuditLog = async ({
  actorUserId = null,
  actorRole = 'anonymous',
  organizationId = null,
  module,
  action,
  targetType,
  targetId,
  metadata = {},
  ip,
  userAgent,
}) =>
  AuditLog.create({
    actorUserId,
    actorRole,
    organizationId,
    module,
    action,
    targetType,
    targetId: targetId ? String(targetId) : undefined,
    metadata,
    ipHash: ip ? hashValue(ip) : undefined,
    userAgentHash: userAgent ? hashValue(userAgent) : undefined,
  });

module.exports = {
  createAuditLog,
};
