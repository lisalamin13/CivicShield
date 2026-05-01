const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('phone').optional().isString(),
];

const loginValidator = [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty(),
];

const requestOtpValidator = [body('phone').isString().notEmpty()];

const verifyOtpValidator = [body('phone').isString().notEmpty(), body('otp').isString().isLength({ min: 6, max: 6 })];

const resetPasswordRequestValidator = [body('email').isEmail().normalizeEmail()];

const resetPasswordValidator = [body('password').isLength({ min: 8 })];

module.exports = {
  loginValidator,
  registerValidator,
  requestOtpValidator,
  resetPasswordRequestValidator,
  resetPasswordValidator,
  verifyOtpValidator,
};
