const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Anam@14',
    database: process.env.DB_NAME || 'amazon_eptw_db'
};

async function checkPermitsColumns() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('\n📋 Checking permits table columns...\n');
        const [rows] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = '${dbConfig.database}'
            AND TABLE_NAME = 'permits'
            ORDER BY ORDINAL_POSITION
        `);

        if (rows.length > 0) {
            console.log('Permits Table Columns:');
            console.log('='.repeat(80));
            rows.forEach(row => {
                console.log(`${row.COLUMN_NAME.padEnd(30)} | ${row.COLUMN_TYPE.padEnd(20)} | Nullable: ${row.IS_NULLABLE}`);
            });
            console.log('='.repeat(80));
        } else {
            console.log('❌ Table "permits" not found.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkPermitsColumns();
