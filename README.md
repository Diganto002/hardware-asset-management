# Hardware Asset Management System (AssetPulse)

A beginner-friendly, production-ready full-stack Hardware Asset Management System built for IT departments to track and audit corporate hardware assets (laptops, monitors, phones, and peripherals) with role-based access control (IT Operator / Admin vs. Auditor).

![Architecture](https://img.shields.io/badge/Architecture-REST_API-6366f1?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-Node.js_Express-339933?style=for-the-badge&logo=node.js)
![Database](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite)
![Frontend](https://img.shields.io/badge/Frontend-Vanilla_HTML5_CSS3_JS-E34F26?style=for-the-badge&logo=html5)
![Tests](https://img.shields.io/badge/Tests-Jest_Supertest-C21325?style=for-the-badge&logo=jest)

---

## 📋 Features

1. **Asset Cataloging (Full CRUD)**:
   - Create, retrieve, update, and delete hardware records.
   - Enforces strict Asset Tag regex: `^IT-[0-9]{5}$` (e.g. `IT-00101`).
   - Enforces unique `serial_number` and `asset_tag` constraints (returns HTTP 409 on duplicates).
2. **Employee Assignment**:
   - Assign available hardware to employees with department tagging.
   - Return assigned hardware back to the available inventory pool.
3. **Automated Status Tracking**:
   - `AVAILABLE` ➔ `ASSIGNED` on device assignment.
   - `ASSIGNED` ➔ `AVAILABLE` on device unassignment (clears employee and department).
   - Prevents assignment of devices in `UNDER_REPAIR` or `RETIRED` statuses (returns HTTP 400).
4. **Search & Filter**:
   - Instant search by Asset Tag or Serial Number with 300ms debounce.
   - Dynamic dropdown filtering by Device Type (`LAPTOP`, `MONITOR`, `PHONE`, `PERIPHERAL`) and Status (`AVAILABLE`, `ASSIGNED`, `UNDER_REPAIR`, `RETIRED`).
   - Fast client-side CSV Export for reporting.
5. **Role-Based Access Control (RBAC)**:
   - Header `x-user-role: admin` (IT Operator): Full access (Create, Edit, Assign, Unassign, Delete).
   - Header `x-user-role: auditor` (Auditor): Read-only access (Search, Filter, Export, View). Mutations rejected with HTTP 403 Forbidden.
   - Interactive role toggle in the UI for testing both perspectives.
6. **Interactive OpenAPI / Swagger Docs**:
   - Available out-of-the-box at `/api/docs`.

---

## 🏗️ Tech Stack

- **Backend**: Node.js, Express, `cors`, `dotenv`, `express-validator`, `uuid`, `swagger-ui-express`
- **Database**: SQLite with native zero-dependency `node:sqlite` engine (WAL mode enabled, indexed on `asset_tag`, `serial_number`, and `status`)
- **Frontend**: Vanilla HTML5, Modern CSS (CSS custom properties, glassmorphism, responsive grid/flexbox), Vanilla JavaScript (Pure DOM)
- **Testing**: Jest + Supertest (9 integration tests covering all critical business rules)
- **CI/CD**: GitHub Actions workflow (`.github/workflows/ci.yml`)

---

## 🗄️ Database Schema

Table name: `assets`

| Column | Type | Constraints / Details |
|---|---|---|
| `id` | TEXT (UUID) | PRIMARY KEY |
| `asset_tag` | TEXT | UNIQUE, NOT NULL, format: `^IT-[0-9]{5}$` |
| `serial_number` | TEXT | UNIQUE, NOT NULL |
| `type` | TEXT | CHECK IN ('LAPTOP', 'MONITOR', 'PHONE', 'PERIPHERAL') |
| `model` | TEXT | NOT NULL |
| `status` | TEXT | CHECK IN ('AVAILABLE', 'ASSIGNED', 'UNDER_REPAIR', 'RETIRED') |
| `assigned_to` | TEXT | Nullable employee name |
| `department` | TEXT | Nullable employee department |
| `created_at` | TEXT | TIMESTAMP DEFAULT (datetime('now')) |

Indexes:
- `idx_assets_asset_tag` on `assets(asset_tag)`
- `idx_assets_serial_number` on `assets(serial_number)`
- `idx_assets_status` on `assets(status)`

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ or 20+ or 22+ or 24+ installed
- npm installed

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```ini
PORT=3000
NODE_ENV=development
DB_PATH=./data/assets.db
TEST_DB_PATH=:memory:
```

### 3. Database Initialization & Seeding
Create tables and seed with 25 realistic enterprise assets:
```bash
# Initialize SQLite schema
npm run db:init

# Seed 25 realistic laptops, monitors, phones, and peripherals
npm run db:seed
```

### 4. Running the Application
Start the development server:
```bash
npm run dev
# or start directly with:
npm start
```
Open your browser and visit:
- **Web Application Portal**: [http://localhost:3000](http://localhost:3000)
- **Interactive Swagger Documentation**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 🧪 Running Automated Tests

Run the complete Jest & Supertest integration test suite:
```bash
npm test
```

### Test Coverage Summary (9 Integration Tests):
1. ✅ **Successful asset creation**: returns 201 and created asset object.
2. ✅ **Duplicate serial_number rejection**: returns HTTP 409 Conflict.
3. ✅ **Malformed asset_tag rejection**: rejects invalid patterns with HTTP 400 Validation Error.
4. ✅ **Successful assign transition**: status becomes `ASSIGNED` and records employee/department.
5. ✅ **Successful unassign transition**: status becomes `AVAILABLE` and clears assignee.
6. ✅ **Prevent assigning damaged/retired devices**: blocks assigning `UNDER_REPAIR` or `RETIRED` assets with HTTP 400.
7. ✅ **List filtering**: filters by type, status, and debounced search term.
8. ✅ **Asset deletion**: removes asset and returns HTTP 200 (subsequent GET returns 404).
9. ✅ **Role-Based Access Control**: auditor role receives HTTP 403 Forbidden on write operations.

---

## 📡 REST API Specifications

Base URL: `/api/v1/assets`

| Method | Endpoint | Description | Auth Header |
|---|---|---|---|
| `GET` | `/api/v1/assets` | List all assets with search & filters | None / Any |
| `GET` | `/api/v1/assets/:id` | Get single asset by UUID | None / Any |
| `POST` | `/api/v1/assets` | Create a new asset | `x-user-role: admin` |
| `PUT` | `/api/v1/assets/:id` | Update asset metadata | `x-user-role: admin` |
| `PATCH` | `/api/v1/assets/:id/assign` | Assign asset to employee | `x-user-role: admin` |
| `PATCH` | `/api/v1/assets/:id/unassign` | Unassign asset back to pool | `x-user-role: admin` |
| `DELETE` | `/api/v1/assets/:id` | Permanently delete asset | `x-user-role: admin` |
| `GET` | `/api/docs` | Swagger UI documentation | None |

### Sample Request: Create Asset
```bash
curl -X POST http://localhost:3000/api/v1/assets \
  -H "Content-Type: application/json" \
  -H "x-user-role: admin" \
  -d '{
    "asset_tag": "IT-00200",
    "serial_number": "SN-DELL-5590-01",
    "type": "LAPTOP",
    "model": "Dell Latitude 5590",
    "status": "AVAILABLE"
  }'
```

### Sample Response: Conflict (409)
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Conflict: An asset with serial number 'SN-DELL-5590-01' already exists."
  }
}
```

---

## 📦 Project Structure

```
.
├── .env.example
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated GitHub Actions test pipeline
├── package.json
├── README.md
├── src/
│   ├── app.js                   # Express application & middleware configuration
│   ├── server.js                # Server entry point
│   ├── config/
│   │   └── database.js          # SQLite connection and table initialization
│   ├── controllers/
│   │   └── assetController.js   # HTTP request & response handlers
│   ├── middleware/
│   │   ├── auth.js              # Mock role-based auth (admin vs auditor)
│   │   ├── errorHandler.js      # Structured JSON error and 404 handlers
│   │   └── validate.js          # Express-validator result parser
│   ├── routes/
│   │   ├── assetRoutes.js       # All 7 CRUD and assignment endpoints
│   │   └── docsRoutes.js        # Swagger UI route at /api/docs
│   ├── scripts/
│   │   ├── initDb.js            # Table and index creation script
│   │   └── seed.js              # 25 realistic device seed data
│   ├── services/
│   │   └── assetService.js      # Business logic & parameterized SQL queries
│   └── validators/
│       └── assetValidator.js    # Regex validation & input sanitization
├── tests/
│   └── assets.test.js           # Supertest integration tests
└── public/
    ├── index.html               # Semantic HTML dashboard
    ├── css/
    │   └── styles.css           # Modern design system, responsive styles, badges
    └── js/
        └── app.js               # Debounced search, filters, modals, role switch
```

---

## 🤝 Conventional Commits Style

This project adheres to the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat:` A new feature (e.g. `feat(assets): add status transition check`)
- `fix:` A bug fix (e.g. `fix(validation): enforce IT-XXXXX regex`)
- `test:` Adding or refactoring tests (e.g. `test: add 9 integration tests`)
- `docs:` Documentation updates (e.g. `docs: add Swagger UI and API reference`)

---

## 📜 License

MIT License. Designed and built for enterprise IT asset tracking.
