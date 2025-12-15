// backend/server.js - COMPLETE WORKING VERSION
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============= PERFORMANCE OPTIMIZATIONS =============
const compression = require('compression');

// Enable gzip compression for all responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6
}));

// Security and performance headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Powered-By', 'Amazon EPTW');
  next();
});

// Middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files with caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// ============= IMPORT ALL ROUTES =============
const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const sitesRoutes = require('./src/routes/sites.routes');
const departmentsRoutes = require('./src/routes/departments.routes');
const usersRoutes = require('./src/routes/users.routes');
const permitsRoutes = require('./src/routes/permits.routes');
const approvalsRoutes = require('./src/routes/approvals.routes');
const masterRoutes = require('./src/routes/master.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const requesterAssignmentsRoutes = require('./src/routes/requester-assignments.routes');
const notificationsRoutes = require('./src/routes/notifications.routes');
const approverSitesRoutes = require('./src/routes/approverSites.routes');
const uploadsRoutes = require('./src/routes/uploads.routes');
const evidenceRoutes = require('./src/routes/evidence.routes');
const extensionApprovalsRoutes = require('./src/routes/extension-approvals.routes');
const workerTrainingEvidenceRoutes = require('./src/routes/workerTrainingEvidence.routes');

const { initScheduler } = require('./src/services/cronService');

// Initialize Scheduler
initScheduler();

// ============= REGISTER ALL ROUTES IN CORRECT ORDER =============
// CRITICAL: Specific routes MUST come BEFORE catch-all routes!

console.log('📋 Registering routes...');

// Core routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
console.log('✅ Auth & Admin routes registered');

// Master data
app.use('/api/sites', sitesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/master', masterRoutes);
console.log('✅ Master data routes registered');

// User management
app.use('/api/users', usersRoutes);
app.use('/api/requester-assignments', requesterAssignmentsRoutes);
console.log('✅ User management routes registered');

// PTW and approvals
app.use('/api/permits', permitsRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/extension-approvals', extensionApprovalsRoutes);
app.use('/api/approvers', approverSitesRoutes);
console.log('✅ PTW & Approval routes registered');

// File uploads - MUST be before evidenceRoutes
app.use('/api/uploads', uploadsRoutes);
console.log('✅ /api/uploads registered');

app.use('/api/training-evidence', workerTrainingEvidenceRoutes);
console.log('✅ /api/training-evidence registered (Worker Training)');

console.log('✅ File upload routes registered');

// Dashboard and notifications
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);
console.log('✅ Dashboard & Notification routes registered');

// Evidence routes with /api catch-all - MUST BE LAST
app.use('/api', evidenceRoutes);
console.log('✅ Evidence routes registered (with /api catch-all)');

// Vendors (optional)
try {
  const vendorsRoutes = require('./src/routes/vendors.routes');
  app.use('/api/vendors', vendorsRoutes);
  console.log('✅ Vendors routes registered');
} catch (err) {
  console.log('ℹ️  Vendors routes not found, using fallback');
  app.get('/api/vendors', (req, res) => {
    res.json({ success: true, data: [] });
  });
}

console.log('✅ All routes registered successfully\n');

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
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Amazon EPTW Backend Server');
  console.log('='.repeat(60));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'amazon_eptw_db'}`);
  console.log('='.repeat(60));
  console.log('\n🔗 Available Routes:');
  console.log('   /api/auth');
  console.log('   /api/admin');
  console.log('   /api/sites');
  console.log('   /api/departments');
  console.log('   /api/master');
  console.log('   /api/users');
  console.log('   /api/requester-assignments');
  console.log('   /api/permits');
  console.log('   /api/approvals');
  console.log('   /api/extension-approvals');
  console.log('   /api/approvers');
  console.log('   /api/uploads');
  console.log('   /api/training-evidence ⭐');
  console.log('   /api/dashboard');
  console.log('   /api/notifications');
  console.log('   /api/vendors');
  console.log('='.repeat(60));
  console.log('\n✅ Server ready! Training evidence route is active.\n');
});

module.exports = app;