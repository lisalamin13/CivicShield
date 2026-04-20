const express = require('express');
const router = express.Router();

const {
    register,
    login,
    verifyAdminLoginOTP,
    resendAdminLoginOTP,
    requestOTP,
    verifyOTP,
    requestSuperOTP,
    verifySuperOTP
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/login/verify-otp', verifyAdminLoginOTP);
router.post('/login/resend-otp', resendAdminLoginOTP);

router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/super/request-otp', requestSuperOTP);
router.post('/super/verify-otp', verifySuperOTP);

module.exports = router;
