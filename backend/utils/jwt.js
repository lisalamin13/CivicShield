const jwt = require('jsonwebtoken');

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_TTL || '15m',
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_TTL || '7d',
  });

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);

const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

const getRefreshCookieOptions = (rememberMe = true) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',
});

module.exports = {
  getRefreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
