const { StatusCodes } = require('http-status-codes');

const User = require('../models/User');
const AppError = require('../utils/appError');
const { sanitizeObject } = require('../utils/sanitize');

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  organizationId: user.organizationId,
  department: user.department,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

const listUsers = async (req, res) => {
  const filter = req.user.role === 'super_admin' ? {} : { organizationId: req.user.organizationId };
  const users = await User.find(filter).sort({ createdAt: -1 }).lean();

  res.status(StatusCodes.OK).json({
    success: true,
    users: users.map(serializeUser),
  });
};

const createUser = async (req, res) => {
  const payload = sanitizeObject(req.body);
  const organizationId =
    req.user.role === 'super_admin' ? payload.organizationId || null : req.user.organizationId;

  if (req.user.role !== 'super_admin' && ['super_admin', 'org_admin'].includes(payload.role)) {
    throw new AppError('Organization admins cannot create privileged platform roles', 403);
  }

  const user = await User.create({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: payload.password || 'TempPass123!',
    role: payload.role || 'staff',
    organizationId,
    department: payload.department,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    user: serializeUser(user),
  });
};

const updateUser = async (req, res) => {
  const payload = sanitizeObject(req.body);
  const user = await User.findById(req.params.userId);

  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  if (
    req.user.role !== 'super_admin' &&
    String(req.user.organizationId) !== String(user.organizationId)
  ) {
    throw new AppError('User access denied', StatusCodes.FORBIDDEN);
  }

  user.name = payload.name || user.name;
  user.phone = payload.phone || user.phone;
  user.department = payload.department || user.department;
  user.role = payload.role || user.role;
  if (payload.password) {
    user.password = payload.password;
  }
  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    user: serializeUser(user),
  });
};

const updateUserStatus = async (req, res) => {
  const { isActive } = sanitizeObject(req.body);
  const user = await User.findById(req.params.userId);

  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  if (
    req.user.role !== 'super_admin' &&
    String(req.user.organizationId) !== String(user.organizationId)
  ) {
    throw new AppError('User access denied', StatusCodes.FORBIDDEN);
  }

  user.isActive = Boolean(isActive);
  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    user: serializeUser(user),
  });
};

module.exports = {
  createUser,
  listUsers,
  updateUser,
  updateUserStatus,
};
