require('dotenv').config();
const app = require('./app');
const { getDb, closeDb } = require('./config/database');

const PORT = process.env.PORT || 3000;

// Initialize database schema
getDb();

const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Hardware Asset Management System is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================================`);
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(() => {
    console.log('HTTP server closed.');
    closeDb();
    console.log('Database connection closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
