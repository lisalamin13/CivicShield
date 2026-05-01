const rateLimit = require('express-rate-limit');

const buildLimiter = (options) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });

const generalLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { success: false, message: 'Too many authentication attempts.' },
});

const otpLimiter = buildLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many OTP requests.' },
});

const aiLimiter = buildLimiter({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: { success: false, message: 'AI request quota temporarily exceeded.' },
});

module.exports = {
  aiLimiter,
  authLimiter,
  generalLimiter,
  otpLimiter,
};
