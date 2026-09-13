const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');

class ApiError extends Error {
  constructor(statusCode, message, code = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class AssetService {
  /**
   * List all assets with search and filter support
   * @param {Object} filters - { search, type, status }
   */
  static getAllAssets(filters = {}) {
    const db = getDb();
    let query = 'SELECT * FROM assets WHERE 1=1';
    const params = [];

    if (filters.search) {
      const searchTerm = `%${filters.search.trim()}%`;
      query += ' AND (asset_tag LIKE ? OR serial_number LIKE ?)';
      params.push(searchTerm, searchTerm);
    }

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type.trim().toUpperCase());
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status.trim().toUpperCase());
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Get single asset by ID
   * @param {string} id
   */
  static getAssetById(id) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM assets WHERE id = ?');
    const asset = stmt.get(id);
    if (!asset) {
      throw new ApiError(404, `Asset with ID '${id}' not found`, 'NOT_FOUND');
    }
    return asset;
  }

  /**
   * Check if serial number already exists (optionally excluding an ID)
   */
  static getBySerialNumber(serialNumber, excludeId = null) {
    const db = getDb();
    let query = 'SELECT * FROM assets WHERE serial_number = ?';
    const params = [serialNumber];
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const stmt = db.prepare(query);
    return stmt.get(...params);
  }

  /**
   * Check if asset tag already exists (optionally excluding an ID)
   */
  static getByAssetTag(assetTag, excludeId = null) {
    const db = getDb();
    let query = 'SELECT * FROM assets WHERE asset_tag = ?';
    const params = [assetTag];
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const stmt = db.prepare(query);
    return stmt.get(...params);
  }

  /**
   * Create a new hardware asset
   * @param {Object} data
   */
  static createAsset(data) {
    const db = getDb();

    // Check duplicate serial number (HTTP 409)
    const existingSerial = this.getBySerialNumber(data.serial_number);
    if (existingSerial) {
      throw new ApiError(409, `Conflict: An asset with serial number '${data.serial_number}' already exists.`, 'CONFLICT');
    }

    // Check duplicate asset tag (HTTP 409)
    const existingTag = this.getByAssetTag(data.asset_tag);
    if (existingTag) {
      throw new ApiError(409, `Conflict: An asset with asset tag '${data.asset_tag}' already exists.`, 'CONFLICT');
    }

    const id = uuidv4();
    const type = data.type.toUpperCase();
    const status = data.status ? data.status.toUpperCase() : (data.assigned_to ? 'ASSIGNED' : 'AVAILABLE');
    const assigned_to = data.assigned_to || null;
    const department = data.department || null;

    const stmt = db.prepare(`
      INSERT INTO assets (id, asset_tag, serial_number, type, model, status, assigned_to, department, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(id, data.asset_tag, data.serial_number, type, data.model, status, assigned_to, department);

    return this.getAssetById(id);
  }

  /**
   * Update asset metadata
   * @param {string} id
   * @param {Object} data
   */
  static updateAsset(id, data) {
    const db = getDb();
    const asset = this.getAssetById(id);

    // If updating serial_number, check uniqueness
    if (data.serial_number && data.serial_number !== asset.serial_number) {
      const existingSerial = this.getBySerialNumber(data.serial_number, id);
      if (existingSerial) {
        throw new ApiError(409, `Conflict: An asset with serial number '${data.serial_number}' already exists.`, 'CONFLICT');
      }
    }

    // If updating asset_tag, check uniqueness
    if (data.asset_tag && data.asset_tag !== asset.asset_tag) {
      const existingTag = this.getByAssetTag(data.asset_tag, id);
      if (existingTag) {
        throw new ApiError(409, `Conflict: An asset with asset tag '${data.asset_tag}' already exists.`, 'CONFLICT');
      }
    }

    const newAssetTag = data.asset_tag || asset.asset_tag;
    const newSerial = data.serial_number || asset.serial_number;
    const newType = data.type ? data.type.toUpperCase() : asset.type;
    const newModel = data.model || asset.model;
    const newStatus = data.status ? data.status.toUpperCase() : asset.status;
    let newAssignedTo = data.assigned_to !== undefined ? data.assigned_to : asset.assigned_to;
    let newDepartment = data.department !== undefined ? data.department : asset.department;

    // If status changed to AVAILABLE, clear assigned fields
    if (newStatus === 'AVAILABLE') {
      newAssignedTo = null;
      newDepartment = null;
    }

    const stmt = db.prepare(`
      UPDATE assets
      SET asset_tag = ?, serial_number = ?, type = ?, model = ?, status = ?, assigned_to = ?, department = ?
      WHERE id = ?
    `);

    stmt.run(newAssetTag, newSerial, newType, newModel, newStatus, newAssignedTo, newDepartment, id);

    return this.getAssetById(id);
  }

  /**
   * Assign an available asset to an employee
   * @param {string} id
   * @param {Object} param1 - { assigned_to, department }
   */
  static assignAsset(id, { assigned_to, department }) {
    const db = getDb();
    const asset = this.getAssetById(id);

    // Business rule: Prevent assigning assets that are UNDER_REPAIR or RETIRED
    if (asset.status === 'UNDER_REPAIR' || asset.status === 'RETIRED') {
      throw new ApiError(
        400,
        `Cannot assign asset: Asset is currently ${asset.status}. Only devices in AVAILABLE status can be assigned to employees.`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const stmt = db.prepare(`
      UPDATE assets
      SET status = 'ASSIGNED', assigned_to = ?, department = ?
      WHERE id = ?
    `);

    stmt.run(assigned_to, department, id);

    return this.getAssetById(id);
  }

  /**
   * Unassign an asset and return it to the available pool
   * @param {string} id
   */
  static unassignAsset(id) {
    const db = getDb();
    // Ensure asset exists
    this.getAssetById(id);

    const stmt = db.prepare(`
      UPDATE assets
      SET status = 'AVAILABLE', assigned_to = NULL, department = NULL
      WHERE id = ?
    `);

    stmt.run(id);

    return this.getAssetById(id);
  }

  /**
   * Delete an asset
   * @param {string} id
   */
  static deleteAsset(id) {
    const db = getDb();
    // Ensure asset exists
    this.getAssetById(id);

    const stmt = db.prepare('DELETE FROM assets WHERE id = ?');
    stmt.run(id);

    return { success: true, message: 'Asset deleted successfully' };
  }
}

module.exports = {
  AssetService,
  ApiError
};
