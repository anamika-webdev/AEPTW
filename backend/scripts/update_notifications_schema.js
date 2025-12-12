const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Anam@14',
    database: process.env.DB_NAME || 'amazon_eptw_db'
};

async function updateSchema() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Modifying notification_type column to VARCHAR(50)...');
        // We change it to VARCHAR(50) to support all current and future types nicely without constant ALTERs
        await connection.query(`
            ALTER TABLE notifications 
            MODIFY COLUMN notification_type VARCHAR(50) NOT NULL;
        `);

        console.log('✅ Successfully updated notification_type column to VARCHAR(50).');

    } catch (error) {
        console.error('❌ Error updating schema:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

updateSchema();
