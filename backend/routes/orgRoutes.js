const express = require('express');
const router = express.Router();
const { registerOrganization } = require('../controllers/orgController');

router.post('/', registerOrganization);

module.exports = router;
