const { body, param, query } = require('express-validator');

const VALID_TYPES = ['LAPTOP', 'MONITOR', 'PHONE', 'PERIPHERAL'];
const VALID_STATUSES = ['AVAILABLE', 'ASSIGNED', 'UNDER_REPAIR', 'RETIRED'];
const ASSET_TAG_REGEX = /^IT-[0-9]{5}$/;

/**
 * Validation rules for creating a new asset
 */
const createAssetValidator = [
  body('asset_tag')
    .trim()
    .notEmpty().withMessage('Asset tag is required')
    .matches(ASSET_TAG_REGEX).withMessage('Asset tag must match format IT-XXXXX (e.g., IT-00001)'),
  body('serial_number')
    .trim()
    .notEmpty().withMessage('Serial number is required')
    .isLength({ min: 3, max: 100 }).withMessage('Serial number must be between 3 and 100 characters')
    .escape(),
  body('type')
    .trim()
    .toUpperCase()
    .isIn(VALID_TYPES).withMessage(`Type must be one of: ${VALID_TYPES.join(', ')}`),
  body('model')
    .trim()
    .notEmpty().withMessage('Model is required')
    .isLength({ min: 2, max: 150 }).withMessage('Model must be between 2 and 150 characters')
    .escape(),
  body('status')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('assigned_to')
    .optional({ nullable: true })
    .trim()
    .escape(),
  body('department')
    .optional({ nullable: true })
    .trim()
    .escape()
];

/**
 * Validation rules for updating asset metadata
 */
const updateAssetValidator = [
  param('id')
    .isUUID().withMessage('Asset ID must be a valid UUID'),
  body('asset_tag')
    .optional()
    .trim()
    .matches(ASSET_TAG_REGEX).withMessage('Asset tag must match format IT-XXXXX (e.g., IT-00001)'),
  body('serial_number')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Serial number must be between 3 and 100 characters')
    .escape(),
  body('type')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(VALID_TYPES).withMessage(`Type must be one of: ${VALID_TYPES.join(', ')}`),
  body('model')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage('Model must be between 2 and 150 characters')
    .escape(),
  body('status')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(VALID_STATUSES).withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  body('assigned_to')
    .optional({ nullable: true })
    .trim()
    .escape(),
  body('department')
    .optional({ nullable: true })
    .trim()
    .escape()
];

/**
 * Validation rules for assigning an asset
 */
const assignAssetValidator = [
  param('id')
    .isUUID().withMessage('Asset ID must be a valid UUID'),
  body('assigned_to')
    .trim()
    .notEmpty().withMessage('assigned_to (employee name) is required')
    .isLength({ min: 2, max: 100 }).withMessage('Employee name must be between 2 and 100 characters')
    .escape(),
  body('department')
    .trim()
    .notEmpty().withMessage('department is required')
    .isLength({ min: 2, max: 100 }).withMessage('Department must be between 2 and 100 characters')
    .escape()
];

/**
 * Validation rules for asset UUID parameter
 */
const idParamValidator = [
  param('id')
    .isUUID().withMessage('Asset ID must be a valid UUID')
];

/**
 * Query filter validator
 */
const queryFilterValidator = [
  query('type')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(VALID_TYPES).withMessage(`Type filter must be one of: ${VALID_TYPES.join(', ')}`),
  query('status')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(VALID_STATUSES).withMessage(`Status filter must be one of: ${VALID_STATUSES.join(', ')}`),
  query('search')
    .optional()
    .trim()
    .escape()
];

module.exports = {
  VALID_TYPES,
  VALID_STATUSES,
  ASSET_TAG_REGEX,
  createAssetValidator,
  updateAssetValidator,
  assignAssetValidator,
  idParamValidator,
  queryFilterValidator
};
