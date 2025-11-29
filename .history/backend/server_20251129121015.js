// backend/server.js - COMPLETE FIXED VERSION WITH ALL ROUTES
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Helper function to safely require routes
function safeRequire(modulePath, routeName) {
  const fullPath = path.join(__dirname, modulePath);
  try {
    if (fs.existsSync(fullPath + '.js')) {
      console.log(`✅ Loading ${routeName} from ${modulePath}`);
      return require(modulePath);
    } else {
      console.log(`⚠️  ${routeName} not found at ${modulePath} - skipping`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error loading ${routeName}: ${error.message}`);
    return null;
  }
}

// Import routes - with safe loading
const authRoutes = safeRequire('./src/routes/auth.routes', 'Auth Routes');
const adminRoutes = safeRequire('./src/routes/admin.routes', 'Admin Routes');
const dashboardRoutes = safeRequire('./src/routes/dashboard.routes', 'Dashboard Routes');
const masterRoutes = safeRequire('./src/routes/master.routes', 'Master Routes');
const sitesRoutes = safeRequire('./src/routes/sites.routes', 'Sites Routes');
const usersRoutes = safeRequire('./src/routes/users.routes', 'Users Routes');
const vendorsRoutes = safeRequire('./src/routes/vendors.routes', 'Vendors Routes');
const permitsRoutes = safeRequire('./src/routes/permits.routes', 'Permits Routes');

// Register routes only if they were successfully loaded
console.log('\n📋 Registering API Routes:');

if (authRoutes) {
  app.use('/api/auth', authRoutes);
  console.log('  ✅ /api/auth');
}

if (adminRoutes) {
  app.use('/api/admin', adminRoutes);
  console.log('  ✅ /api/admin');
}

if (dashboardRoutes) {
  app.use('/api/dashboard', dashboardRoutes);
  console.log('  ✅ /api/dashboard');
}

if (masterRoutes) {
  app.use('/api/master', masterRoutes);
  console.log('  ✅ /api/master');
}

if (sitesRoutes) {
  app.use('/api/sites', sitesRoutes);
  console.log('  ✅ /api/sites');
}

if (usersRoutes) {
  app.use('/api/users', usersRoutes);
  console.log('  ✅ /api/users');
}

if (vendorsRoutes) {
  app.use('/api/vendors', vendorsRoutes);
  console.log('  ✅ /api/vendors');
}

if (permitsRoutes) {
  app.use('/api/permits', permitsRoutes);
  console.log('  ✅ /api/permits');
}

console.log('');

// Health check route
app.get('/api/health', (req, res) => {
  const loadedRoutes = {
    auth: !!authRoutes,
    admin: !!adminRoutes,
    dashboard: !!dashboardRoutes,
    master: !!masterRoutes,
    sites: !!sitesRoutes,
    users: !!usersRoutes,
    vendors: !!vendorsRoutes,
    permits: !!permitsRoutes
  };

  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    routes: loadedRoutes
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      '/api/auth',
      '/api/admin',
      '/api/dashboard',
      '/api/master',
      '/api/sites',
      '/api/users',
      '/api/vendors',
      '/api/permits'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
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
  console.log('✅ Server is running!');
  console.log(`   Visit http://localhost:${PORT}/api/health to check route status\n`);
});

module.exports = app;