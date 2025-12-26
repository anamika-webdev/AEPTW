const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eptw_db',
};

async function addJobRoleColumn() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Check if column exists
        const [columns] = await connection.query(`
      SHOW COLUMNS FROM users LIKE 'job_role'
    `);

        if (columns.length === 0) {
            console.log('Adding job_role column to users table...');
            try {
                await connection.query(`
            ALTER TABLE users
            ADD COLUMN job_role VARCHAR(100) NULL
          `);
                console.log('✅ job_role column added successfully.');
            } catch (err) {
                console.error('Error adding column:', err.message);
            }

        } else {
            console.log('ℹ️ job_role column already exists.');
        }

    } catch (error) {
        console.error('Error connection/query:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

addJobRoleColumn();
