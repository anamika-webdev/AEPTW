// backend/server.js - FIXED VERSION WITH APPROVER SITES ROUTES ENABLED
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
  level: 6 // Balance between compression ratio and CPU usage
}));

// Security and performance headers
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Performance headers
  res.setHeader('X-Powered-By', 'Amazon EPTW');

  next();
});

// Middleware
app.use((req, res, next) => {
  console.log(`🌐 INCOMING: ${req.method} ${req.originalUrl}`);
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files with caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d', // Cache for 1 day
  etag: true,
  lastModified: true
}));

// Request logging (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

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

// ============= REGISTER ALL ROUTES =============
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/permits', permitsRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/requester-assignments', requesterAssignmentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/approvers', approverSitesRoutes);
app.use('/api/training-evidence', workerTrainingEvidenceRoutes); // Renamed for simplicity & conflict avoidance
app.use('/api', evidenceRoutes); // Checked before /api/uploads to handle /uploads/evidence
app.use('/api/uploads', uploadsRoutes);
app.use('/api/extension-approvals', extensionApprovalsRoutes);

console.log('✅ Approver sites, Uploads, Evidence, and Extension Approval routes loaded successfully');

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
  console.log('   /api/users');
  console.log('   /api/permits');
  console.log('   /api/approvals');
  console.log('   /api/master');
  console.log('   /api/dashboard');
  console.log('   /api/requester-assignments');
  console.log('   /api/notifications');
  console.log('   /api/approvers          ⭐ FIXED!');
  console.log('   /api/worker-training-evidence');
  console.log('   /api/vendors');
  console.log('============================================================\n');
  console.log('✅ Server is ready!\n');
});

module.exports = app;
