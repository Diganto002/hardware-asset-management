const { getDb, closeDb } = require('../config/database');

console.log('🔄 Initializing SQLite database schema...');
const db = getDb();
console.log('✅ Tables and indexes created successfully!');
closeDb();
process.exit(0);
