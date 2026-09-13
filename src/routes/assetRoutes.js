const express = require('express');
const { AssetController } = require('../controllers/assetController');
const { requireAdmin } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');
const {
  createAssetValidator,
  updateAssetValidator,
  assignAssetValidator,
  idParamValidator,
  queryFilterValidator
} = require('../validators/assetValidator');

const router = express.Router();

/**
 * GET /api/v1/assets
 * List all assets with query filter and search
 */
router.get(
  '/',
  queryFilterValidator,
  handleValidationErrors,
  AssetController.getAll
);

/**
 * GET /api/v1/assets/:id
 * Retrieve single asset details
 */
router.get(
  '/:id',
  idParamValidator,
  handleValidationErrors,
  AssetController.getById
);

/**
 * POST /api/v1/assets
 * Create a new asset (Requires Admin role)
 */
router.post(
  '/',
  requireAdmin,
  createAssetValidator,
  handleValidationErrors,
  AssetController.create
);

/**
 * PUT /api/v1/assets/:id
 * Update asset metadata (Requires Admin role)
 */
router.put(
  '/:id',
  requireAdmin,
  updateAssetValidator,
  handleValidationErrors,
  AssetController.update
);

/**
 * PATCH /api/v1/assets/:id/assign
 * Assign asset to employee (Requires Admin role)
 */
router.patch(
  '/:id/assign',
  requireAdmin,
  assignAssetValidator,
  handleValidationErrors,
  AssetController.assign
);

/**
 * PATCH /api/v1/assets/:id/unassign
 * Unassign asset back to available pool (Requires Admin role)
 */
router.patch(
  '/:id/unassign',
  requireAdmin,
  idParamValidator,
  handleValidationErrors,
  AssetController.unassign
);

/**
 * DELETE /api/v1/assets/:id
 * Delete asset (Requires Admin role)
 */
router.delete(
  '/:id',
  requireAdmin,
  idParamValidator,
  handleValidationErrors,
  AssetController.delete
);

module.exports = router;
