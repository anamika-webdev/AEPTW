# Create a test file to check database connection
@'
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'amazon_eptw_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('Testing database connection...');
    const connection = await pool.getConnection();
    console.log('✅ Database connected!');
    
    console.log('\nFetching users...');
    const [users] = await connection.query('SELECT id, login_id, email, role, CASE WHEN password_hash IS NOT NULL THEN "YES" ELSE "NO" END as has_password FROM users LIMIT 5');
    console.log('Users in database:');
    console.table(users);
    
    connection.release();
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testConnection();
