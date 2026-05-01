const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');

const AppError = require('../utils/appError');

const validate = (req, _res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return next(
    new AppError('Validation failed', StatusCodes.UNPROCESSABLE_ENTITY, result.array()),
  );
};

module.exports = {
  validate,
};
