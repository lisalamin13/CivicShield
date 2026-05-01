const { StatusCodes } = require('http-status-codes');

const AppError = require('../utils/appError');

const notFound = (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, StatusCodes.NOT_FOUND));
};

module.exports = {
  notFound,
};
