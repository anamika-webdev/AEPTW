// backend/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT token
 * Extracts token from Authorization header and verifies it
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required. Please login to continue.'
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
      if (err) {
        console.error('Token verification failed:', err.message);
        
        // Handle specific JWT errors
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token has expired. Please login again.'
          });
        }
        
        if (err.name === 'JsonWebTokenError') {
          return res.status(403).json({
            success: false,
            message: 'Invalid token. Please login again.'
          });
        }
        
        return res.status(403).json({
          success: false,
          message: 'Token verification failed.'
        });
      }

      // Attach decoded user info to request object
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Middleware to check if user has specific role
 * @param {string|string[]} roles - Required role(s)
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

/**
 * Middleware to check if user is supervisor (Area Manager or Safety Approver)
 */
const isSupervisor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const supervisorRoles = ['Approver_AreaManager', 'Approver_Safety'];
  
  if (!supervisorRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Supervisor access required'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  authorizeRole,
  isAdmin,
  isSupervisor
};