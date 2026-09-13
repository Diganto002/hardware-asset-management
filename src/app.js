const express = require('express');
const cors = require('cors');
const path = require('path');
const assetRoutes = require('./routes/assetRoutes');
const docsRoutes = require('./routes/docsRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger API Documentation
app.use('/api/docs', docsRoutes);

// Hardware Asset Management API endpoints
app.use('/api/v1/assets', assetRoutes);

// Handle undefined API routes with 404 JSON
app.use('/api/*', notFoundHandler);

// Fallback to frontend index.html for SPA-style navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
