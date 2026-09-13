const express = require('express');
const swaggerUi = require('swagger-ui-express');

const router = express.Router();

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Hardware Asset Management System API',
    version: '1.0.0',
    description: 'Centralized IT Department Hardware Asset Management REST API. Supports asset cataloging, employee assignment, status tracking, search & filter, and role-based access control (IT Operator vs Auditor).'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      RoleAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-user-role',
        description: "User role header: 'admin' (IT Operator - Full Access) or 'auditor' (Read-Only)."
      }
    },
    schemas: {
      Asset: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'd8c7c90b-d2be-498c-8c10-fa9d9006fe01' },
          asset_tag: { type: 'string', example: 'IT-00101', description: 'Must match regex ^IT-[0-9]{5}$' },
          serial_number: { type: 'string', example: 'SN-X1C-99011' },
          type: { type: 'string', enum: ['LAPTOP', 'MONITOR', 'PHONE', 'PERIPHERAL'], example: 'LAPTOP' },
          model: { type: 'string', example: 'ThinkPad X1 Carbon Gen 11' },
          status: { type: 'string', enum: ['AVAILABLE', 'ASSIGNED', 'UNDER_REPAIR', 'RETIRED'], example: 'AVAILABLE' },
          assigned_to: { type: 'string', nullable: true, example: 'Alex Morgan' },
          department: { type: 'string', nullable: true, example: 'DevOps' },
          created_at: { type: 'string', format: 'date-time', example: '2026-09-13T10:00:00.000Z' }
        }
      },
      CreateAssetRequest: {
        type: 'object',
        required: ['asset_tag', 'serial_number', 'type', 'model'],
        properties: {
          asset_tag: { type: 'string', example: 'IT-00150' },
          serial_number: { type: 'string', example: 'SN-MAC-2024-001' },
          type: { type: 'string', enum: ['LAPTOP', 'MONITOR', 'PHONE', 'PERIPHERAL'], example: 'LAPTOP' },
          model: { type: 'string', example: 'MacBook Pro 16" M3 Max' },
          status: { type: 'string', enum: ['AVAILABLE', 'ASSIGNED', 'UNDER_REPAIR', 'RETIRED'], example: 'AVAILABLE' },
          assigned_to: { type: 'string', nullable: true, example: null },
          department: { type: 'string', nullable: true, example: null }
        }
      },
      AssignAssetRequest: {
        type: 'object',
        required: ['assigned_to', 'department'],
        properties: {
          assigned_to: { type: 'string', example: 'Sarah Connor' },
          department: { type: 'string', example: 'Engineering' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'CONFLICT' },
              message: { type: 'string', example: 'Conflict: An asset with serial number already exists.' }
            }
          }
        }
      }
    }
  },
  paths: {
    '/api/v1/assets': {
      get: {
        summary: 'List all assets (with search and filter)',
        description: 'Returns all assets with optional search by asset_tag/serial_number and filters by type/status.',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term for asset_tag or serial_number' },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['LAPTOP', 'MONITOR', 'PHONE', 'PERIPHERAL'] }, description: 'Filter by hardware type' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['AVAILABLE', 'ASSIGNED', 'UNDER_REPAIR', 'RETIRED'] }, description: 'Filter by status' }
        ],
        responses: {
          200: {
            description: 'List of assets',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, count: { type: 'integer' }, data: { type: 'array', items: { $ref: '#/components/schemas/Asset' } } } } } }
          }
        }
      },
      post: {
        summary: 'Create a new asset',
        security: [{ RoleAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAssetRequest' } } }
        },
        responses: {
          201: { description: 'Asset created successfully' },
          400: { description: 'Validation error (malformed asset tag or missing required fields)' },
          403: { description: 'Forbidden (auditor role cannot create)' },
          409: { description: 'Conflict (duplicate serial_number or asset_tag)' }
        }
      }
    },
    '/api/v1/assets/{id}': {
      get: {
        summary: 'Get asset by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Asset retrieved successfully' },
          404: { description: 'Asset not found' }
        }
      },
      put: {
        summary: 'Update asset metadata',
        security: [{ RoleAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAssetRequest' } } }
        },
        responses: {
          200: { description: 'Asset updated successfully' },
          403: { description: 'Forbidden' },
          404: { description: 'Asset not found' },
          409: { description: 'Conflict (duplicate serial_number)' }
        }
      },
      delete: {
        summary: 'Delete an asset',
        security: [{ RoleAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Asset deleted successfully' },
          403: { description: 'Forbidden' },
          404: { description: 'Asset not found' }
        }
      }
    },
    '/api/v1/assets/{id}/assign': {
      patch: {
        summary: 'Assign asset to an employee',
        description: 'Transitions status from AVAILABLE to ASSIGNED. Fails if asset is UNDER_REPAIR or RETIRED.',
        security: [{ RoleAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AssignAssetRequest' } } }
        },
        responses: {
          200: { description: 'Asset assigned successfully' },
          400: { description: 'Cannot assign asset that is UNDER_REPAIR or RETIRED' },
          403: { description: 'Forbidden' },
          404: { description: 'Asset not found' }
        }
      }
    },
    '/api/v1/assets/{id}/unassign': {
      patch: {
        summary: 'Unassign asset back to available pool',
        description: 'Transitions status from ASSIGNED to AVAILABLE and clears assigned employee details.',
        security: [{ RoleAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Asset unassigned successfully' },
          403: { description: 'Forbidden' },
          404: { description: 'Asset not found' }
        }
      }
    }
  }
};

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
