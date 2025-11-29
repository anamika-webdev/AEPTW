// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

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

// Health check
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
    status: 'ok', 
    message: 'Amazon EPTW API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    routes: loadedRoutes
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Amazon EPTW Backend API',
    version: '1.0.0',
    endpoints: {
      auth: authRoutes ? '/api/auth/*' : 'not loaded',
      admin: adminRoutes ? '/api/admin/*' : 'not loaded',
      dashboard: dashboardRoutes ? '/api/dashboard/*' : 'not loaded',
      master: masterRoutes ? '/api/master/*' : 'not loaded',
      sites: sitesRoutes ? '/api/sites/*' : 'not loaded',
      users: usersRoutes ? '/api/users/*' : 'not loaded',
      vendors: vendorsRoutes ? '/api/vendors/*' : 'not loaded',
      permits: permitsRoutes ? '/api/permits/*' : 'not loaded',
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
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'amazon_eptw_db'}`);
  console.log('='.repeat(60));
  console.log('\n✅ Server is running!');
  console.log('   Visit http://localhost:5000/api/health to check route status');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;