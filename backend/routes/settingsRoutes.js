const express = require('express');

const { getSystemSettings, updateSystemSettings } = require('../controllers/settingsController');
const { authorize, protect } = require('../middleware/auth');

const router = express.Router();

router.get('/system', protect, authorize('super_admin'), getSystemSettings);
router.patch('/system', protect, authorize('super_admin'), updateSystemSettings);

module.exports = router;
