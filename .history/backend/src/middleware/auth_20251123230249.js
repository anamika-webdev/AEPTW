const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Access token required' });

    jwt.verify(token, process.env.JWT_SECRET || 'default_secret', async (err, decoded) => {
      if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
      const [users] = await pool.query('SELECT id, login_id, full_name, email, role FROM users WHERE id = ?', [decoded.userId]);
      if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
      req.user = users[0];
      next();
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    next();
  };
};

module.exports = { authenticateToken, authorize };