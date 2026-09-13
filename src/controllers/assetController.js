const { AssetService } = require('../services/assetService');

class AssetController {
  /**
   * GET /api/v1/assets
   * List all assets with search and filter
   */
  static getAll(req, res, next) {
    try {
      const { search, type, status } = req.query;
      const assets = AssetService.getAllAssets({ search, type, status });
      res.status(200).json({
        success: true,
        count: assets.length,
        data: assets
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/assets/:id
   * Get single asset by ID
   */
  static getById(req, res, next) {
    try {
      const { id } = req.params;
      const asset = AssetService.getAssetById(id);
      res.status(200).json({
        success: true,
        data: asset
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/assets
   * Create new asset (Admin only)
   */
  static create(req, res, next) {
    try {
      const asset = AssetService.createAsset(req.body);
      res.status(201).json({
        success: true,
        message: 'Asset created successfully',
        data: asset
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/assets/:id
   * Update asset metadata (Admin only)
   */
  static update(req, res, next) {
    try {
      const { id } = req.params;
      const updatedAsset = AssetService.updateAsset(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Asset updated successfully',
        data: updatedAsset
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/assets/:id/assign
   * Assign asset to employee (Admin only)
   */
  static assign(req, res, next) {
    try {
      const { id } = req.params;
      const { assigned_to, department } = req.body;
      const asset = AssetService.assignAsset(id, { assigned_to, department });
      res.status(200).json({
        success: true,
        message: `Asset ${asset.asset_tag} assigned to ${assigned_to} successfully`,
        data: asset
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/assets/:id/unassign
   * Unassign asset and return to pool (Admin only)
   */
  static unassign(req, res, next) {
    try {
      const { id } = req.params;
      const asset = AssetService.unassignAsset(id);
      res.status(200).json({
        success: true,
        message: `Asset ${asset.asset_tag} unassigned and returned to AVAILABLE pool`,
        data: asset
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/assets/:id
   * Delete asset (Admin only)
   */
  static delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = AssetService.deleteAsset(id);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = {
  AssetController
};
