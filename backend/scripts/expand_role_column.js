const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eptw_db',
};

async function expandRoleColumn() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        console.log('Expanding role column to VARCHAR(255)...');

        // Change role column to VARCHAR(255) to support comma separated values
        await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN role VARCHAR(255) NOT NULL DEFAULT 'Worker';
    `);

        console.log('✅ Role column expanded successfully.');

    } catch (error) {
        console.error('Error updating database:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

expandRoleColumn();
