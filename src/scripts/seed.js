const { v4: uuidv4 } = require('uuid');
const { getDb, closeDb } = require('../config/database');

const seedAssets = [
  {
    asset_tag: 'IT-00101',
    serial_number: 'SN-AAPL-M3M-001',
    type: 'LAPTOP',
    model: 'Apple MacBook Pro 16" (M3 Max, 36GB RAM, 1TB SSD)',
    status: 'ASSIGNED',
    assigned_to: 'Alex Morgan',
    department: 'Engineering'
  },
  {
    asset_tag: 'IT-00102',
    serial_number: 'SN-LNVO-X1C-002',
    type: 'LAPTOP',
    model: 'Lenovo ThinkPad X1 Carbon Gen 11 (i7, 32GB)',
    status: 'ASSIGNED',
    assigned_to: 'Elena Rostova',
    department: 'DevOps'
  },
  {
    asset_tag: 'IT-00103',
    serial_number: 'SN-DELL-XPS-003',
    type: 'LAPTOP',
    model: 'Dell XPS 15 9530 (OLED 3.5K, i9, 32GB)',
    status: 'AVAILABLE',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00104',
    serial_number: 'SN-AAPL-AIR-004',
    type: 'LAPTOP',
    model: 'Apple MacBook Air 15" M2 (16GB RAM, 512GB)',
    status: 'ASSIGNED',
    assigned_to: 'Marcus Vance',
    department: 'Product Design'
  },
  {
    asset_tag: 'IT-00105',
    serial_number: 'SN-HP-EB84-005',
    type: 'LAPTOP',
    model: 'HP EliteBook 840 G10 (i7-1365U, 16GB)',
    status: 'AVAILABLE',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00106',
    serial_number: 'SN-ASUS-G14-006',
    type: 'LAPTOP',
    model: 'ASUS ROG Zephyrus G14 (Ryzen 9, RTX 4070)',
    status: 'UNDER_REPAIR',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00107',
    serial_number: 'SN-FRMK-16-007',
    type: 'LAPTOP',
    model: 'Framework Laptop 16 (Ryzen 7 7840HS, Modular)',
    status: 'AVAILABLE',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00108',
    serial_number: 'SN-LNVO-T14-008',
    type: 'LAPTOP',
    model: 'Lenovo ThinkPad T14s Gen 2 (i5, 16GB)',
    status: 'RETIRED',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00109',
    serial_number: 'SN-DELL-U27-009',
    type: 'MONITOR',
    model: 'Dell UltraSharp U2723QE 27" 4K USB-C Hub Monitor',
    status: 'ASSIGNED',
    assigned_to: 'Alex Morgan',
    department: 'Engineering'
  },
  {
    asset_tag: 'IT-00110',
    serial_number: 'SN-LG-34WN-010',
    type: 'MONITOR',
    model: 'LG 34WN80C-B 34" Curved UltraWide QHD IPS',
    status: 'ASSIGNED',
    assigned_to: 'David Kim',
    department: 'Marketing'
  },
  {
    asset_tag: 'IT-00111',
    serial_number: 'SN-AAPL-DIS-011',
    type: 'MONITOR',
    model: 'Apple Studio Display 27" 5K Retina (Nano-texture)',
    status: 'AVAILABLE',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00112',
    serial_number: 'SN-BNQ-PD32-012',
    type: 'MONITOR',
    model: 'BenQ DesignVue PD3220U 32" 4K UHD Thunderbolt 3',
    status: 'UNDER_REPAIR',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00113',
    serial_number: 'SN-ASUS-PA2-013',
    type: 'MONITOR',
    model: 'ASUS ProArt Display PA278CV 27" WQHD Color Accurate',
    status: 'AVAILABLE',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00114',
    serial_number: 'SN-AAPL-P15-014',
    type: 'PHONE',
    model: 'Apple iPhone 15 Pro Max 256GB Titanium Blue',
    status: 'ASSIGNED',
    assigned_to: 'Sarah Connor',
    department: 'Executive'
  },
  {
    asset_tag: 'IT-00115',
    serial_number: 'SN-SMSG-S24-015',
    type: 'PHONE',
    model: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray',
    status: 'ASSIGNED',
    assigned_to: 'Jordan Lee',
    department: 'Sales'
  },
  {
    asset_tag: 'IT-00116',
    serial_number: 'SN-GOOG-PX8-016',
    type: 'PHONE',
    model: 'Google Pixel 8 Pro 128GB Obsidian',
    status: 'AVAILABLE',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00117',
    serial_number: 'SN-AAPL-P14-017',
    type: 'PHONE',
    model: 'Apple iPhone 14 128GB Midnight',
    status: 'RETIRED',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00118',
    serial_number: 'SN-LOGI-MX3-018',
    type: 'PERIPHERAL',
    model: 'Logitech MX Master 3S Wireless Performance Mouse',
    status: 'ASSIGNED',
    assigned_to: 'Elena Rostova',
    department: 'DevOps'
  },
  {
    asset_tag: 'IT-00119',
    serial_number: 'SN-KYCH-Q1P-019',
    type: 'PERIPHERAL',
    model: 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard',
    status: 'AVAILABLE',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00120',
    serial_number: 'SN-CLDG-TS4-020',
    type: 'PERIPHERAL',
    model: 'CalDigit TS4 Thunderbolt 4 Dock 18-Port (98W Host Charge)',
    status: 'ASSIGNED',
    assigned_to: 'Marcus Vance',
    department: 'Product Design'
  },
  {
    asset_tag: 'IT-00121',
    serial_number: 'SN-JBRA-E85-021',
    type: 'PERIPHERAL',
    model: 'Jabra Evolve2 85 ANC Wireless Headset with Stand',
    status: 'AVAILABLE',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00122',
    serial_number: 'SN-ELGT-SDK-022',
    type: 'PERIPHERAL',
    model: 'Elgato Stream Deck XL (32 Customizable LCD Keys)',
    status: 'UNDER_REPAIR',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00123',
    serial_number: 'SN-POLY-P15-023',
    type: 'PERIPHERAL',
    model: 'Poly Studio P15 4K Personal Video Conference Bar',
    status: 'AVAILABLE',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00124',
    serial_number: 'SN-DELL-WD1-024',
    type: 'PERIPHERAL',
    model: 'Dell WD19TBS Thunderbolt Dock 130W',
    status: 'RETIRED',
    assigned_to: null,
    department: null
  },
  {
    asset_tag: 'IT-00125',
    serial_number: 'SN-LOGI-B91-025',
    type: 'PERIPHERAL',
    model: 'Logitech Brio 4K Pro Webcam with HDR & Windows Hello',
    status: 'AVAILABLE',
    assigned_to: null,
    department: null
  }
];

function seed() {
  console.log('🌱 Seeding database with 25 realistic hardware assets...');
  const db = getDb();

  // Clear existing assets to allow clean re-seeding
  db.exec('DELETE FROM assets');

  const insertStmt = db.prepare(`
    INSERT INTO assets (id, asset_tag, serial_number, type, model, status, assigned_to, department, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  for (const asset of seedAssets) {
    const id = uuidv4();
    insertStmt.run(
      id,
      asset.asset_tag,
      asset.serial_number,
      asset.type,
      asset.model,
      asset.status,
      asset.assigned_to,
      asset.department
    );
  }

  const countRow = db.prepare('SELECT count(*) as total FROM assets').get();
  console.log(`✅ Database successfully seeded! Total assets in DB: ${countRow.total}`);
  closeDb();
}

seed();
