const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

// Try to load db config from the project, or fallback to confirmed defaults
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Anam@14',
    database: process.env.DB_NAME || 'amazon_eptw_db'
};

async function checkSchema() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Querying schema for permits table...');
        const [rows] = await connection.query(`
            SELECT COLUMN_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '${dbConfig.database}'
            AND TABLE_NAME = 'permits'
            AND COLUMN_NAME = 'status'
        `);

        if (rows.length > 0) {
            console.log('Status Column Type:', rows[0].COLUMN_TYPE);
        } else {
            console.log('Column "status" not found in "permits" table or table does not exist.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkSchema();
