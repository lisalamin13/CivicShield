const { body } = require('express-validator');

const onboardOrganizationValidator = [
  body('organizationName').trim().notEmpty(),
  body('adminName').trim().notEmpty(),
  body('adminEmail').isEmail().normalizeEmail(),
  body('adminPassword').isLength({ min: 8 }),
];

const addDepartmentValidator = [body('name').trim().notEmpty(), body('code').optional().trim()];

module.exports = {
  addDepartmentValidator,
  onboardOrganizationValidator,
};
