const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eptw_db',
};

async function addSiteIdColumn() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Check if column exists first
        const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'site_id';
    `, [dbConfig.database]);

        if (columns.length > 0) {
            console.log('✅ site_id column already exists.');
        } else {
            console.log('Adding site_id column to users table...');
            await connection.query(`
        ALTER TABLE users 
        ADD COLUMN site_id INT NULL,
        ADD FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL;
      `);
            console.log('✅ site_id column added successfully.');
        }

    } catch (error) {
        console.error('Error updating database:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

addSiteIdColumn();
