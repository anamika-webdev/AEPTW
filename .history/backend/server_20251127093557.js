// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Amazon EPTW API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Amazon EPTW Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      admin: '/api/admin/*',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 Amazon EPTW Backend Server Started');
  console.log('='.repeat(60));
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'amazon_eptw_db'}`);
  console.log('='.repeat(60));
  console.log('\n📋 Available API Endpoints:');
  console.log('');
  console.log('  Authentication:');
  console.log('    POST   /api/auth/login           - User login');
  console.log('    POST   /api/auth/register        - User registration');
  console.log('    GET    /api/auth/me              - Get current user');
  console.log('');
  console.log('  Admin:');
  console.log('    GET    /api/admin/stats          - Dashboard statistics');
  console.log('    GET    /api/admin/analytics      - Dashboard analytics');
  console.log('    GET    /api/admin/permits        - All permits (with filters)');
  console.log('    GET    /api/admin/permits/:id    - Single permit details');
  console.log('    GET    /api/admin/users          - All users');
  console.log('    POST   /api/admin/users          - Add new user');
  console.log('    PUT    /api/admin/users/:id      - Update user');
  console.log('    DELETE /api/admin/users/:id      - Delete user');
  console.log('    GET    /api/admin/sites          - All sites');
  console.log('    POST   /api/admin/sites          - Add new site');
  console.log('    PUT    /api/admin/sites/:id      - Update site');
  console.log('    DELETE /api/admin/sites/:id      - Delete site');
  console.log('');
  console.log('  Other:');
  console.log('    GET    /api/health               - Health check');
  console.log('');
  console.log('='.repeat(60));
  console.log('✅ Server ready to accept connections');
  console.log('='.repeat(60));
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;