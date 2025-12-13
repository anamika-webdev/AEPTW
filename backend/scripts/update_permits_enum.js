const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Anam@14',
    database: process.env.DB_NAME || 'amazon_eptw_db'
};

async function updateEnum() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Altering permits table to add "Extended" and "Extension_Rejected" to status ENUM...');

        // Include all existing values PLUS the new ones
        await connection.query(`
            ALTER TABLE permits 
            MODIFY COLUMN status ENUM(
                'Initiated',
                'Approved',
                'Ready_To_Start',
                'Active',
                'Extension_Requested',
                'Extended',
                'Extension_Rejected',
                'Closed',
                'Rejected'
            ) NOT NULL DEFAULT 'Initiated'
        `);

        console.log('✅ Permits table status ENUM updated successfully.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

updateEnum();
