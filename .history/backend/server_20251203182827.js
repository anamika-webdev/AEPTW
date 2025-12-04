// backend/server.js - COMPLETE FIXED VERSION WITH ALL ROUTES
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============= IMPORT ALL ROUTES =============
const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const sitesRoutes = require('./src/routes/sites.routes');
const departmentsRoutes = require('./src/routes/departments.routes');
const usersRoutes = require('./src/routes/users.routes');
const permitsRoutes = require('./src/routes/permits.routes');
const masterRoutes = require('./src/routes/master.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const requesterAssignmentsRoutes = require('./src/routes/requester-assignments.routes');

// ============= REGISTER ALL ROUTES =============
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/users', usersRoutes);           // ⭐ CRITICAL
app.use('/api/permits', permitsRoutes);
app.use('/api/master', masterRoutes);         // ⭐ CRITICAL
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/requester-assignments', requesterAssignmentsRoutes);
// Vendors route (if separate file exists)
try {
  const vendorsRoutes = require('./src/routes/vendors.routes');
  app.use('/api/vendors', vendorsRoutes);
} catch (err) {
  console.warn('⚠️ Vendors routes not found, using fallback');
  // Fallback vendors endpoint
  app.get('/api/vendors', (req, res) => {
    res.json({ success: true, data: [] });
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  console.error(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n============================================================');
  console.log('🚀 Amazon EPTW Backend Server Started');
  console.log('============================================================');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'amazon_eptw_db'}`);
  console.log('============================================================\n');
  console.log('✅ Registered Routes:');
  console.log('   /api/auth');
  console.log('   /api/admin');
  console.log('   /api/sites');
  console.log('   /api/departments');
  console.log('   /api/users          ⭐');
  console.log('   /api/permits');
  console.log('   /api/master         ⭐');
  console.log('   /api/dashboard');
  console.log('   /api/vendors');
  console.log('============================================================\n');
  console.log('✅ Server is ready!\n');
});

module.exports = app;