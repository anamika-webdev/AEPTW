// backend/src/config/database.js - OPTIMIZED VERSION
const mysql = require('mysql2/promise');
require('dotenv').config();

// ============= OPTIMIZED CONNECTION POOL =============
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'amazon_eptw_db',

    // ⭐ PERFORMANCE OPTIMIZATIONS
    connectionLimit: 20, // Increased from default 10
    queueLimit: 0, // Unlimited queue
    waitForConnections: true,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,

    // Connection timeout settings
    connectTimeout: 10000, // 10 seconds
    acquireTimeout: 10000,
    timeout: 60000, // Query timeout: 60 seconds

    // Performance flags
    multipleStatements: false, // Security: prevent SQL injection
    dateStrings: false, // Better performance
    supportBigNumbers: true,
    bigNumberStrings: false,

    // Character set
    charset: 'utf8mb4'
});

// ============= CONNECTION MONITORING =============
pool.on('connection', (connection) => {
    console.log('✅ New database connection established');
});

pool.on('acquire', (connection) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('📊 Connection %d acquired', connection.threadId);
    }
});

pool.on('release', (connection) => {
    if (process.env.NODE_ENV === 'development') {
        console.log('📊 Connection %d released', connection.threadId);
    }
});

// ============= HEALTH CHECK =============
const checkConnection = async () => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        console.log('✅ Database connection pool is healthy');
        return true;
    } catch (error) {
        console.error('❌ Database connection pool error:', error.message);
        return false;
    }
};

// ============= GRACEFUL SHUTDOWN =============
process.on('SIGINT', async () => {
    console.log('\n🔄 Closing database connection pool...');
    await pool.end();
    console.log('✅ Database connection pool closed');
    process.exit(0);
});

module.exports = { pool, checkConnection };
