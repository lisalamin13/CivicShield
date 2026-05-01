const express = require('express');

const {
  addDepartment,
  getOrganization,
  listOrganizations,
  listPublicOrganizations,
  onboardOrganization,
  updateOrganization,
  updateOrganizationStatus,
} = require('../controllers/organizationController');
const { authorize, protect, requireOrganizationScope } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  addDepartmentValidator,
  onboardOrganizationValidator,
} = require('../validators/organizationValidators');

const router = express.Router();

router.post('/onboard', onboardOrganizationValidator, validate, onboardOrganization);
router.get('/public/catalog', listPublicOrganizations);
router.get('/', protect, authorize('super_admin', 'org_admin'), listOrganizations);
router.get('/:organizationId', protect, authorize('super_admin', 'org_admin'), getOrganization);
router.patch('/:organizationId', protect, authorize('super_admin', 'org_admin'), requireOrganizationScope, updateOrganization);
router.patch('/:organizationId/status', protect, authorize('super_admin'), updateOrganizationStatus);
router.post(
  '/:organizationId/departments',
  protect,
  authorize('super_admin', 'org_admin'),
  requireOrganizationScope,
  addDepartmentValidator,
  validate,
  addDepartment,
);

module.exports = router;
