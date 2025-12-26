const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eptw_db',
};

async function modifyRoleColumn() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        console.log('Modifying role column to VARCHAR(50)...');

        // Change role column from ENUM to VARCHAR
        await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN role VARCHAR(50) NOT NULL;
    `);

        console.log('✅ Role column modified successfully.');

    } catch (error) {
        console.error('Error updating database:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

modifyRoleColumn();
