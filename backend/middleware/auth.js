const { StatusCodes } = require('http-status-codes');

const SystemSetting = require('../models/SystemSetting');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { verifyAccessToken } = require('../utils/jwt');

const attachUser = async (token) => {
  if (!token) {
    return null;
  }

  try {
    const decoded = verifyAccessToken(token);
    return await User.findById(decoded.sub).select('+refreshTokens');
  } catch (_error) {
    return null;
  }
};

const resolveToken = (req) => {
  const header = req.headers.authorization;

  if (header?.startsWith('Bearer ')) {
    return header.split(' ')[1];
  }

  return null;
};

const protect = async (req, _res, next) => {
  const user = await attachUser(resolveToken(req));

  if (!user || !user.isActive) {
    return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
  }

  req.user = user;
  return next();
};

const optionalAuth = async (req, _res, next) => {
  const user = await attachUser(resolveToken(req));

  if (user) {
    req.user = user;
  }

  return next();
};

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
  }

  if (!roles.includes(req.user.role)) {
    return next(new AppError('You are not allowed to perform this action', StatusCodes.FORBIDDEN));
  }

  return next();
};

const requireOrganizationScope = (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
  }

  if (req.user.role === 'super_admin') {
    return next();
  }

  const routeOrganizationId =
    req.params.organizationId || req.body.organizationId || req.query.organizationId;

  if (
    routeOrganizationId &&
    req.user.organizationId &&
    String(routeOrganizationId) !== String(req.user.organizationId)
  ) {
    return next(new AppError('Cross-organization access is blocked', StatusCodes.FORBIDDEN));
  }

  return next();
};

const respectMaintenanceMode = async (req, _res, next) => {
  if (req.path === '/health') {
    return next();
  }

  try {
    const settings = await SystemSetting.findOne({ key: 'platform' }).lean();

    if (!settings?.maintenanceMode) {
      return next();
    }

    const user = await attachUser(resolveToken(req));

    if (user?.role === 'super_admin') {
      req.user = user;
      return next();
    }

    return next(
      new AppError(
        settings.maintenanceMessage || 'CivicShield is temporarily under maintenance',
        StatusCodes.SERVICE_UNAVAILABLE,
      ),
    );
  } catch (_error) {
    return next();
  }
};

module.exports = {
  authorize,
  optionalAuth,
  protect,
  requireOrganizationScope,
  respectMaintenanceMode,
};
