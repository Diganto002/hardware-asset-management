const { validationResult } = require('express-validator');

/**
 * Middleware to check validation errors from express-validator
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: formattedErrors[0]?.message || 'Invalid input data',
        details: formattedErrors
      }
    });
  }
  next();
}

module.exports = {
  handleValidationErrors
};
