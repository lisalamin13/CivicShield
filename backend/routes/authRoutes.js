const express = require('express');

const {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  requestPhoneOtp,
  resetPassword,
  verifyPhoneOtp,
} = require('../controllers/authController');
const { optionalAuth, protect } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiters');
const { validate } = require('../middleware/validate');
const {
  loginValidator,
  registerValidator,
  requestOtpValidator,
  resetPasswordRequestValidator,
  resetPasswordValidator,
  verifyOtpValidator,
} = require('../validators/authValidators');

const router = express.Router();

router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/request-otp', otpLimiter, requestOtpValidator, validate, requestPhoneOtp);
router.post('/verify-otp', authLimiter, verifyOtpValidator, validate, verifyPhoneOtp);
router.post('/forgot-password', authLimiter, resetPasswordRequestValidator, validate, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordValidator, validate, resetPassword);
router.post('/refresh', refresh);
router.post('/logout', optionalAuth, logout);
router.get('/me', protect, me);

module.exports = router;
