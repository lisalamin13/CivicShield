const { StatusCodes } = require('http-status-codes');
const { nanoid } = require('nanoid');

const Organization = require('../models/Organization');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { generateRandomToken, hashValue } = require('../utils/crypto');
const { getRefreshCookieOptions, signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sanitizeObject } = require('../utils/sanitize');
const { createAuditLog } = require('../services/auditService');
const { requestOtp, verifyOtp } = require('../services/otpService');

const buildSessionResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  organizationId: user.organizationId,
  department: user.department,
});

const issueSession = async ({ user, req, res, rememberMe = true }) => {
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
    organizationId: user.organizationId ? user.organizationId.toString() : null,
  });
  const refreshToken = signRefreshToken({
    sub: user._id.toString(),
    nonce: nanoid(),
  });

  const refreshTokenHash = hashValue(refreshToken);

  user.refreshTokens = [
    ...(user.refreshTokens || []).filter((token) => token.expiresAt > new Date()),
    {
      tokenHash: refreshTokenHash,
      userAgent: req.headers['user-agent'],
      expiresAt: new Date(Date.now() + (rememberMe ? 7 : 1) * 24 * 60 * 60 * 1000),
    },
  ];
  user.lastLoginAt = new Date();
  await user.save();

  res.cookie(
    process.env.JWT_REFRESH_COOKIE_NAME || 'civicshield_refresh',
    refreshToken,
    getRefreshCookieOptions(rememberMe),
  );

  return {
    accessToken,
    user: buildSessionResponse(user),
  };
};

const register = async (req, res) => {
  const payload = sanitizeObject(req.body);
  const user = await User.create({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
    organizationId: payload.organizationId || null,
    role: 'reporter',
  });

  await createAuditLog({
    actorUserId: user._id,
    actorRole: user.role,
    organizationId: user.organizationId,
    module: 'auth',
    action: 'register',
    targetType: 'user',
    targetId: user._id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  const userWithTokens = await User.findById(user._id).select('+refreshTokens');
  const session = await issueSession({ user: userWithTokens, req, res, rememberMe: true });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Account created successfully',
    ...session,
  });
};

const login = async (req, res) => {
  const { email, password, rememberMe = true } = sanitizeObject(req.body);
  const user = await User.findOne({ email }).select('+password +refreshTokens');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
  }

  if (!user.isActive) {
    throw new AppError('This account is inactive', StatusCodes.FORBIDDEN);
  }

  if (user.organizationId) {
    const organization = await Organization.findById(user.organizationId).lean();
    if (organization?.status === 'suspended') {
      throw new AppError('This organization is suspended', StatusCodes.FORBIDDEN);
    }
  }

  const session = await issueSession({ user, req, res, rememberMe: Boolean(rememberMe) });

  await createAuditLog({
    actorUserId: user._id,
    actorRole: user.role,
    organizationId: user.organizationId,
    module: 'auth',
    action: 'login',
    targetType: 'user',
    targetId: user._id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Login successful',
    ...session,
  });
};

const requestPhoneOtp = async (req, res) => {
  const { phone } = sanitizeObject(req.body);
  const user = await User.findOne({ phone }).lean();

  if (!user) {
    throw new AppError('No account found for this phone number', StatusCodes.NOT_FOUND);
  }

  const result = await requestOtp({
    phone,
    userId: user._id,
    organizationId: user.organizationId,
    purpose: 'login',
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'OTP sent successfully',
    ...result,
  });
};

const verifyPhoneOtp = async (req, res) => {
  const { phone, otp, rememberMe = true } = sanitizeObject(req.body);
  const verification = await verifyOtp({ phone, otp, purpose: 'login' });

  if (!verification.valid) {
    throw new AppError(verification.reason, StatusCodes.UNAUTHORIZED);
  }

  const user = await User.findById(verification.record.userId).select('+refreshTokens');

  if (!user) {
    throw new AppError('User not found for this OTP session', StatusCodes.NOT_FOUND);
  }

  user.isPhoneVerified = true;
  const session = await issueSession({ user, req, res, rememberMe: Boolean(rememberMe) });

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Phone login successful',
    ...session,
  });
};

const forgotPassword = async (req, res) => {
  const { email } = sanitizeObject(req.body);
  const user = await User.findOne({ email }).select('+resetPasswordTokenHash');

  if (!user) {
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'If this email exists, a reset link has been generated.',
    });
    return;
  }

  const resetToken = generateRandomToken(16);
  user.resetPasswordTokenHash = hashValue(resetToken);
  user.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Password reset token generated.',
    resetToken: process.env.NODE_ENV === 'production' ? undefined : resetToken,
    resetUrl:
      process.env.NODE_ENV === 'production'
        ? undefined
        : `${process.env.APP_BASE_URL || 'http://localhost:5000'}/reset-password/${resetToken}`,
  });
};

const resetPassword = async (req, res) => {
  const password = sanitizeObject(req.body.password);
  const tokenHash = hashValue(req.params.token);

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+resetPasswordTokenHash +refreshTokens');

  if (!user) {
    throw new AppError('Invalid or expired reset token', StatusCodes.BAD_REQUEST);
  }

  user.password = password;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  user.refreshTokens = [];
  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Password reset successful',
  });
};

const refresh = async (req, res) => {
  const cookieName = process.env.JWT_REFRESH_COOKIE_NAME || 'civicshield_refresh';
  const refreshToken = req.cookies[cookieName];

  if (!refreshToken) {
    throw new AppError('Refresh token missing', StatusCodes.UNAUTHORIZED);
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.sub).select('+refreshTokens');

  if (!user) {
    throw new AppError('User not found', StatusCodes.UNAUTHORIZED);
  }

  const refreshTokenHash = hashValue(refreshToken);
  const sessionRecord = user.refreshTokens.find((token) => token.tokenHash === refreshTokenHash);

  if (!sessionRecord || sessionRecord.expiresAt < new Date()) {
    throw new AppError('Refresh token is invalid or expired', StatusCodes.UNAUTHORIZED);
  }

  user.refreshTokens = user.refreshTokens.filter((token) => token.tokenHash !== refreshTokenHash);
  const session = await issueSession({ user, req, res, rememberMe: true });

  res.status(StatusCodes.OK).json({
    success: true,
    ...session,
  });
};

const logout = async (req, res) => {
  const cookieName = process.env.JWT_REFRESH_COOKIE_NAME || 'civicshield_refresh';
  const refreshToken = req.cookies[cookieName];

  if (req.user && refreshToken) {
    const user = await User.findById(req.user._id).select('+refreshTokens');
    const refreshTokenHash = hashValue(refreshToken);
    user.refreshTokens = (user.refreshTokens || []).filter((token) => token.tokenHash !== refreshTokenHash);
    await user.save();
  }

  res.clearCookie(cookieName, getRefreshCookieOptions(true));
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Logged out successfully',
  });
};

const me = async (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    user: buildSessionResponse(req.user),
  });
};

module.exports = {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  requestPhoneOtp,
  resetPassword,
  verifyPhoneOtp,
};
