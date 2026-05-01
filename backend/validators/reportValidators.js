const { body } = require('express-validator');

const createReportValidator = [
  body('organizationId').isString().notEmpty(),
  body('subject').trim().notEmpty(),
  body('narrative').trim().notEmpty(),
  body('category').optional().trim(),
  body('department').optional().trim(),
  body('anonymous').optional().isBoolean(),
];

const trackReportValidator = [
  body('trackingCode').trim().notEmpty(),
  body('accessKey').trim().notEmpty(),
];

const messageValidator = [body('message').trim().notEmpty()];

const statusValidator = [body('status').trim().notEmpty(), body('note').optional().trim()];

const assignValidator = [body('assignedTo').optional().isString(), body('assignedDepartment').optional().trim()];

const complianceRuleValidator = [
  body('code').trim().notEmpty(),
  body('title').trim().notEmpty(),
  body('category').trim().notEmpty(),
];

module.exports = {
  assignValidator,
  complianceRuleValidator,
  createReportValidator,
  messageValidator,
  statusValidator,
  trackReportValidator,
};
