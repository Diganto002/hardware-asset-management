const request = require('supertest');
const app = require('../src/app');
const { getDb, closeDb } = require('../src/config/database');

describe('Hardware Asset Management API Integration Tests', () => {
  let testDb;

  beforeAll(() => {
    // In-memory test database initialized
    process.env.NODE_ENV = 'test';
    process.env.TEST_DB_PATH = ':memory:';
    testDb = getDb(':memory:');
  });

  afterAll(() => {
    closeDb();
  });

  beforeEach(() => {
    // Reset test database before each test
    testDb.exec('DELETE FROM assets');
  });

  // Test 1: Successful asset creation
  test('1. Successful asset creation returns 201 and created asset', async () => {
    const newAsset = {
      asset_tag: 'IT-10001',
      serial_number: 'SN-TEST-001',
      type: 'LAPTOP',
      model: 'Dell Latitude 7440',
      status: 'AVAILABLE'
    };

    const res = await request(app)
      .post('/api/v1/assets')
      .set('x-user-role', 'admin')
      .send(newAsset);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.asset_tag).toBe('IT-10001');
    expect(res.body.data.serial_number).toBe('SN-TEST-001');
    expect(res.body.data.status).toBe('AVAILABLE');
    expect(res.body.data.type).toBe('LAPTOP');
  });

  // Test 2: Reject duplicate serial_number (HTTP 409)
  test('2. Reject duplicate serial_number with HTTP 409 Conflict', async () => {
    const assetA = {
      asset_tag: 'IT-10002',
      serial_number: 'SN-DUPLICATE-999',
      type: 'MONITOR',
      model: 'LG 27UP850-W'
    };

    // First creation succeeds
    await request(app)
      .post('/api/v1/assets')
      .set('x-user-role', 'admin')
      .send(assetA)
      .expect(201);

    // Second creation with identical serial_number but different asset_tag
    const assetB = {
      asset_tag: 'IT-10003',
      serial_number: 'SN-DUPLICATE-999',
      type: 'MONITOR',
      model: 'LG 27UP850-W'
    };

    const res = await request(app)
      .post('/api/v1/assets')
      .set('x-user-role', 'admin')
      .send(assetB);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.message).toMatch(/serial number/i);
  });

  // Test 3: Reject malformed asset_tag (HTTP 400)
  test('3. Reject malformed asset_tag with HTTP 400 Validation Error', async () => {
    const malformedAsset = {
      asset_tag: 'INVALID-TAG-99', // violates ^IT-[0-9]{5}$
      serial_number: 'SN-MALFORM-001',
      type: 'PHONE',
      model: 'Google Pixel 7'
    };

    const res = await request(app)
      .post('/api/v1/assets')
      .set('x-user-role', 'admin')
      .send(malformedAsset);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/IT-XXXXX/i);
  });

  // Test 4: Successful assign → status becomes ASSIGNED
  test('4. Successful assign transitions status to ASSIGNED and updates assignee', async () => {
    // First create available asset
    const created = await request(app)
      .post('/api/v1/assets')
      .set('x-user-role', 'admin')
      .send({
        asset_tag: 'IT-10004',
        serial_number: 'SN-ASSIGN-001',
        type: 'LAPTOP',
        model: 'MacBook Air M2',
        status: 'AVAILABLE'
      });

    const assetId = created.body.data.id;

    // Assign to employee
    const res = await request(app)
      .patch(`/api/v1/assets/${assetId}/assign`)
      .set('x-user-role', 'admin')
      .send({
        assigned_to: 'Alice Walker',
        department: 'Cybersecurity'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ASSIGNED');
    expect(res.body.data.assigned_to).toBe('Alice Walker');
    expect(res.body.data.department).toBe('Cybersecurity');
  });

  // Test 5: Successful unassign → status becomes AVAILABLE
  test('5. Successful unassign transitions status to AVAILABLE and clears assignee', async () => {
    // Create and assign an asset
    const created = await request(app)
      .post('/api/v1/assets')
      .set('x-user-role', 'admin')
      .send({
        asset_tag: 'IT-10005',
        serial_number: 'SN-UNASSIGN-001',
        type: 'PERIPHERAL',
        model: 'Logitech MX Keys',
        assigned_to: 'Bob Martin',
        department: 'Infrastructure'
      });

    const assetId = created.body.data.id;

    // Unassign asset
    const res = await request(app)
      .patch(`/api/v1/assets/${assetId}/unassign`)
      .set('x-user-role', 'admin');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('AVAILABLE');
    expect(res.body.data.assigned_to).toBeNull();
    expect(res.body.data.department).toBeNull();
  });

  // Test 6: Prevent assigning UNDER_REPAIR or RETIRED assets
  test('6. Prevent assigning UNDER_REPAIR or RETIRED assets with HTTP 400', async () => {
    // 6a: Test UNDER_REPAIR
    const repairAsset = await request(app)
      .post('/api/v1/assets')
      .set('x-user-role', 'admin')
      .send({
        asset_tag: 'IT-10006',
        serial_number: 'SN-REPAIR-001',
        type: 'LAPTOP',
        model: 'ThinkPad X13',
        status: 'UNDER_REPAIR'
      });

    const repairRes = await request(app)
      .patch(`/api/v1/assets/${repairAsset.body.data.id}/assign`)
      .set('x-user-role', 'admin')
      .send({
        assigned_to: 'Charlie Brown',
        department: 'QA'
      });

    expect(repairRes.status).toBe(400);
    expect(repairRes.body.success).toBe(false);
    expect(repairRes.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    expect(repairRes.body.error.message).toMatch(/UNDER_REPAIR/i);

    // 6b: Test RETIRED
    const retiredAsset = await request(app)
      .post('/api/v1/assets')
      .set('x-user-role', 'admin')
      .send({
        asset_tag: 'IT-10007',
        serial_number: 'SN-RETIRED-001',
        type: 'PHONE',
        model: 'iPhone 11',
        status: 'RETIRED'
      });

    const retiredRes = await request(app)
      .patch(`/api/v1/assets/${retiredAsset.body.data.id}/assign`)
      .set('x-user-role', 'admin')
      .send({
        assigned_to: 'Diana Prince',
        department: 'Legal'
      });

    expect(retiredRes.status).toBe(400);
    expect(retiredRes.body.success).toBe(false);
    expect(retiredRes.body.error.code).toBe('INVALID_STATUS_TRANSITION');
    expect(retiredRes.body.error.message).toMatch(/RETIRED/i);
  });

  // Test 7: GET list with filters works
  test('7. GET list with filters (type, status, search) returns correct filtered records', async () => {
    // Seed 3 distinct assets
    await request(app).post('/api/v1/assets').set('x-user-role', 'admin').send({
      asset_tag: 'IT-20001',
      serial_number: 'SN-FILTER-L1',
      type: 'LAPTOP',
      model: 'Dell XPS 13',
      status: 'AVAILABLE'
    });

    await request(app).post('/api/v1/assets').set('x-user-role', 'admin').send({
      asset_tag: 'IT-20002',
      serial_number: 'SN-FILTER-M1',
      type: 'MONITOR',
      model: 'Dell UltraSharp',
      status: 'ASSIGNED',
      assigned_to: 'Dev One',
      department: 'R&D'
    });

    await request(app).post('/api/v1/assets').set('x-user-role', 'admin').send({
      asset_tag: 'IT-20003',
      serial_number: 'SN-FILTER-L2',
      type: 'LAPTOP',
      model: 'MacBook Pro',
      status: 'UNDER_REPAIR'
    });

    // Filter by type=LAPTOP
    const typeRes = await request(app).get('/api/v1/assets?type=LAPTOP');
    expect(typeRes.status).toBe(200);
    expect(typeRes.body.data.length).toBe(2);
    expect(typeRes.body.data.every(a => a.type === 'LAPTOP')).toBe(true);

    // Filter by status=AVAILABLE
    const statusRes = await request(app).get('/api/v1/assets?status=AVAILABLE');
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.length).toBe(1);
    expect(statusRes.body.data[0].asset_tag).toBe('IT-20001');

    // Search by partial tag or serial
    const searchRes = await request(app).get('/api/v1/assets?search=FILTER-M1');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].asset_tag).toBe('IT-20002');
  });

  // Test 8: Delete works correctly
  test('8. Delete asset returns 200 and removes asset from database', async () => {
    const created = await request(app)
      .post('/api/v1/assets')
      .set('x-user-role', 'admin')
      .send({
        asset_tag: 'IT-30001',
        serial_number: 'SN-DELETE-001',
        type: 'PHONE',
        model: 'Pixel 6'
      });

    const assetId = created.body.data.id;

    // Delete asset
    const delRes = await request(app)
      .delete(`/api/v1/assets/${assetId}`)
      .set('x-user-role', 'admin');

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Verify it is gone (404)
    const getRes = await request(app).get(`/api/v1/assets/${assetId}`);
    expect(getRes.status).toBe(404);
  });

  // Bonus Test: Auditor role cannot mutate assets (HTTP 403 Forbidden)
  test('9. Auditor role cannot perform mutations and receives HTTP 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/assets')
      .set('x-user-role', 'auditor')
      .send({
        asset_tag: 'IT-40001',
        serial_number: 'SN-AUDITOR-001',
        type: 'LAPTOP',
        model: 'Surface Laptop 5'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
