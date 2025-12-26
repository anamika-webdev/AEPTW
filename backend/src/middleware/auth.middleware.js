// backend/src/middleware/auth.middleware.js - FIXED VERSION
// Handles both old and new JWT token formats for backward compatibility

const jwt = require('jsonwebtoken');
const pool = require('../config/database');

/**
 * Middleware to authenticate JWT tokens
 * Handles both formats:
 * 1. New format: { userId: 123 }
 * 2. Old format: { id: 123, user_id: "ABC", user_type: "admin", ... }
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', async (err, decoded) => {
      if (err) {
        console.log('❌ Token verification failed:', err.message);
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      console.log('🔓 Token decoded:', decoded);

      // Handle NEW token format: { userId: 123 }
      if (decoded.userId) {
        try {
          const [users] = await pool.query(
            'SELECT id, login_id, full_name, email, role FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.userId]
          );

          if (users.length === 0) {
            return res.status(404).json({
              success: false,
              message: 'User not found or inactive'
            });
          }

          req.user = users[0];
          console.log('✅ User loaded from DB (new format):', req.user.id, req.user.role);
          return next();
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
          return res.status(500).json({
            success: false,
            message: 'Authentication error'
          });
        }
      }

      // Handle OLD token format: { id, user_id, user_type, role, ... }
      if (decoded.id) {
        // Try to fetch fresh user data from DB
        try {
          const [users] = await pool.query(
            'SELECT id, login_id, full_name, email, role FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.id]
          );

          if (users.length > 0) {
            req.user = users[0];
            console.log('✅ User loaded from DB (old format):', req.user.id, req.user.role);
            return next();
          }
        } catch (dbError) {
          console.warn('⚠️ Could not fetch user from DB, using token data:', dbError.message);
        }

        // Fallback: Use token data directly (for old tokens)
        req.user = {
          id: decoded.id,
          login_id: decoded.user_id || decoded.login_id,
          full_name: decoded.name || decoded.full_name,
          email: decoded.email,
          role: decoded.role || decoded.user_type || 'User',
          department_id: decoded.department_id || null
        };

        console.log('✅ User from token (fallback):', req.user.id, req.user.role);
        return next();
      }

      // If neither format matches
      console.log('❌ Invalid token format:', decoded);
      return res.status(403).json({
        success: false,
        message: 'Invalid token format'
      });
    });
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

/**
 * Middleware to authorize admin users only
 */
const authorizeAdmin = (req, res, next) => {
  console.log('🔐 Admin authorization check');
  console.log('   User:', req.user?.id);
  console.log('   Role:', req.user?.role);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const userRoles = (req.user.role || '').toLowerCase().split(',').map(r => r.trim());
  const isAdmin = userRoles.some(r =>
    r === 'admin' ||
    r === 'administrator'
  );

  console.log('   Roles (lowercase):', userRoles);
  console.log('   Is Admin:', isAdmin);

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
      debug: {
        yourRole: req.user.role,
        requiredRole: 'Admin or Administrator'
      }
    });
  }

  console.log('✅ Admin authorization passed');
  next();
};

/**
 * Middleware to authorize specific roles
 * Usage: router.use(authorize('Admin', 'Approver_Safety'))
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login first'
      });
    }

    // Convert user roles to array
    const userRoles = (req.user.role || '').split(',').map(r => r.trim());

    // Check if ANY of the user's roles match ANY of the allowed roles
    const hasPermission = userRoles.some(userRole => allowedRoles.includes(userRole));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your roles: ${req.user.role}`
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeAdmin,
  authorize
};