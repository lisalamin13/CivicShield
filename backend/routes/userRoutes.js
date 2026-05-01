const express = require('express');

const { createUser, listUsers, updateUser, updateUserStatus } = require('../controllers/userController');
const { authorize, protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('super_admin', 'org_admin'));

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:userId', updateUser);
router.patch('/:userId/status', updateUserStatus);

module.exports = router;
