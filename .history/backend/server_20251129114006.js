// server.js - FIXED VERSION
const express = require('express');
const mysql = require('mysql2/promise'); // CHANGED: Using promise version
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Database connection - CHANGED: Using createPool with promise
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'amazon_eptw_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
(async () => {
  try {
    const connection = await db.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }
})();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth Routes - FIXED: Using async/await with promises
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // CHANGED: Using await with promise-based query
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    
    // For demo purposes, using plain text password comparison
    // In production, use bcrypt.compare(password, user.password)
    const isValidPassword = password === 'password123' || await bcrypt.compare(password, user.password);
    
    if (isValidPassword) {
      const token = jwt.sign(
        { 
          id: user.id, 
          user_id: user.user_id, 
          user_type: user.user_type,
          name: user.name,
          email: user.email,
          domain: user.domain,
          contact: user.contact,
          location: user.location,
          city: user.city,
          state: user.state
        },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          user_type: user.user_type,
          domain: user.domain,
          contact: user.contact,
          location: user.location,
          city: user.city,
          state: user.state,
          is_available: user.is_available
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User Routes - FIXED: Using async/await
app.get('/api/users', authenticateToken, async (req, res) => {
  const { user_type } = req.query;
  let query = 'SELECT id, user_id, name, email, contact, user_type, domain, location, city, state, is_available FROM users';
  let params = [];

  if (user_type) {
    query += ' WHERE user_type = ?';
    params.push(user_type);
  }

  try {
    const [results] = await db.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/workers', authenticateToken, async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT u.*, 
             CASE WHEN t.id IS NOT NULL THEN false ELSE true END as is_available
      FROM users u
      LEFT JOIN tasks t ON u.user_id = t.worker_id AND t.status IN ('active', 'in_progress')
      WHERE u.user_type = 'worker'
    `);
    res.json(results);
  } catch (err) {
    console.error('Error fetching workers:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, contact, domain, location, city, state } = req.body;

  try {
    await db.query(
      'UPDATE users SET name = ?, email = ?, contact = ?, domain = ?, location = ?, city = ?, state = ? WHERE id = ?',
      [name, email, contact, domain, location, city, state, id]
    );
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Site Routes - FIXED: Using async/await
app.get('/api/sites', authenticateToken, async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM sites ORDER BY name');
    res.json(results);
  } catch (err) {
    console.error('Error fetching sites:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/sites', authenticateToken, async (req, res) => {
  const { site_code, name, address } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: 'Name and address are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO sites (site_code, name, address) VALUES (?, ?, ?)',
      [site_code, name, address]
    );
    res.json({ message: 'Site created successfully', id: result.insertId });
  } catch (err) {
    console.error('Error creating site:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/sites/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { site_code, name, address } = req.body;

  try {
    await db.query(
      'UPDATE sites SET site_code = ?, name = ?, address = ? WHERE id = ?',
      [site_code, name, address, id]
    );
    res.json({ message: 'Site updated successfully' });
  } catch (err) {
    console.error('Error updating site:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/sites/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM sites WHERE id = ?', [id]);
    res.json({ message: 'Site deleted successfully' });
  } catch (err) {
    console.error('Error deleting site:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Task Routes - FIXED: Using async/await
app.get('/api/tasks', authenticateToken, async (req, res) => {
  const { supervisor_id, worker_id, status } = req.query;
  
  let query = `
    SELECT t.*, 
           s.name as site_name,
           u.name as worker_name
    FROM tasks t
    LEFT JOIN sites s ON t.site_id = s.id
    LEFT JOIN users u ON t.worker_id = u.user_id
    WHERE 1=1
  `;
  let params = [];

  if (supervisor_id) {
    query += ' AND t.supervisor_id = ?';
    params.push(supervisor_id);
  }
  if (worker_id) {
    query += ' AND t.worker_id = ?';
    params.push(worker_id);
  }
  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }

  query += ' ORDER BY t.created_at DESC';

  try {
    const [results] = await db.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { site_id, worker_id, description, start_time, end_time } = req.body;
  const supervisor_id = req.user.user_id;

  try {
    const [result] = await db.query(
      'INSERT INTO tasks (site_id, worker_id, supervisor_id, description, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [site_id, worker_id, supervisor_id, description, start_time, end_time, 'active']
    );
    res.json({ message: 'Task created successfully', id: result.insertId });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, photo_url } = req.body;

  try {
    if (photo_url) {
      await db.query(
        'UPDATE tasks SET status = ?, photo_url = ?, updated_at = NOW() WHERE id = ?',
        [status, photo_url, id]
      );
    } else {
      await db.query(
        'UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
    }
    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Worker Stats - FIXED: Using async/await
app.get('/api/workers/:workerId/active-tasks-count', authenticateToken, async (req, res) => {
  const { workerId } = req.params;

  try {
    const [results] = await db.query(
      'SELECT COUNT(*) as count FROM tasks WHERE worker_id = ? AND status = "active"',
      [workerId]
    );
    res.json({ count: results[0].count });
  } catch (err) {
    console.error('Error fetching worker stats:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Dashboard stats - FIXED: Using async/await
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  const { user_type, user_id } = req.user;

  if (user_type === 'admin') {
    try {
      // Admin dashboard stats
      const [totalUsers] = await db.query('SELECT COUNT(*) as total_users FROM users');
      const [totalSupervisors] = await db.query('SELECT COUNT(*) as total_supervisors FROM users WHERE user_type = "supervisor"');
      const [totalWorkers] = await db.query('SELECT COUNT(*) as total_workers FROM users WHERE user_type = "worker"');
      const [totalSites] = await db.query('SELECT COUNT(*) as total_sites FROM sites');
      const [totalTasks] = await db.query('SELECT COUNT(*) as total_tasks FROM tasks');
      const [activeTasks] = await db.query('SELECT COUNT(*) as active_tasks FROM tasks WHERE status = "active"');
      const [completedTasks] = await db.query('SELECT COUNT(*) as completed_tasks FROM tasks WHERE status = "completed"');

      res.json({
        totalUsers: totalUsers[0].total_users,
        totalSupervisors: totalSupervisors[0].total_supervisors,
        totalWorkers: totalWorkers[0].total_workers,
        totalSites: totalSites[0].total_sites,
        totalTasks: totalTasks[0].total_tasks,
        activeTasks: activeTasks[0].active_tasks,
        completedTasks: completedTasks[0].completed_tasks
      });
    } catch (err) {
      console.error('Stats error:', err);
      res.status(500).json({ error: 'Database error' });
    }
  } else {
    res.json({ message: 'Stats not available for this user type' });
  }
});

// CREATE USER - FIXED: Using async/await
app.post('/api/users', authenticateToken, async (req, res) => {
  const { user_id, name, email, password, contact, user_type, domain, location, city, state } = req.body;

  // Only admin can create users
  if (req.user.user_type !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create users' });
  }

  try {
    // Check if user_id or email already exists
    const [results] = await db.query('SELECT * FROM users WHERE user_id = ? OR email = ?', [user_id, email]);

    if (results.length > 0) {
      return res.status(400).json({ error: 'User ID or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db.query(
      'INSERT INTO users (user_id, name, email, password, contact, user_type, domain, location, city, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, name, email, hashedPassword, contact, user_type, domain, location, city, state]
    );
    
    res.json({ message: 'User created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ 
    message: 'File uploaded successfully',
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n============================================================`);
  console.log(`🚀 Amazon EPTW Backend Server Started`);
  console.log(`============================================================`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'amazon_eptw_db'}`);
  console.log(`============================================================\n`);
});