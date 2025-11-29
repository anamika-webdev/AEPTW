// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const masterRoutes = require('./src/routes/master.routes');
const sitesRoutes = require('./src/routes/sites.routes');
const usersRoutes = require('./src/routes/users.routes');
const vendorsRoutes = require('./src/routes/vendors.routes');
const permitsRoutes = require('./src/routes/permits.routes');

// API Routes - Register all routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/permits', permitsRoutes);

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
      dashboard: '/api/dashboard/*',
      master: '/api/master/*',
      sites: '/api/sites/*',
      users: '/api/users/*',
      vendors: '/api/vendors/*',
      permits: '/api/permits/*',
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
    path: req.path,
    message: 'This API endpoint does not exist. Check /api/health for available routes.'
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
  console.log('    POST   /api/auth/login');
  console.log('    POST   /api/auth/register');
  console.log('');
  console.log('  Dashboard:');
  console.log('    GET    /api/dashboard/stats');
  console.log('    GET    /api/dashboard/supervisor/stats');
  console.log('');
  console.log('  Master Data:');
  console.log('    GET    /api/master/hazards');
  console.log('    GET    /api/master/ppe');
  console.log('    GET    /api/master/checklist-questions');
  console.log('');
  console.log('  Sites:');
  console.log('    GET    /api/sites');
  console.log('');
  console.log('  Users:');
  console.log('    GET    /api/users/workers');
  console.log('');
  console.log('  Vendors:');
  console.log('    GET    /api/vendors');
  console.log('');
  console.log('  Permits:');
  console.log('    GET    /api/permits');
  console.log('    POST   /api/permits');
  console.log('    GET    /api/permits/my-supervisor-permits');
  console.log('');
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;