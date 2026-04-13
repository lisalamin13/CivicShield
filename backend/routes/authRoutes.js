const express = require('express');
const router = express.Router();

const {
    register,
    login,
    requestOTP,
    verifyOTP,
    requestSuperOTP,
    verifySuperOTP
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/super/request-otp', requestSuperOTP);
router.post('/super/verify-otp', verifySuperOTP);

module.exports = router;
