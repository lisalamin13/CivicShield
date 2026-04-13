const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { 
    requestOTP, 
    verifyOTP, 
    requestSuperOTP, // Check if this is missing!
    verifySuperOTP  // Check if this is missing!
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/super/request-otp', requestSuperOTP); // Line 10?
router.post('/super/verify-otp', verifySuperOTP);

module.exports = router;