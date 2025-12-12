const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Anam@14',
    database: process.env.DB_NAME || 'amazon_eptw_db'
};

async function checkMasterSchemas() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        console.log('--- master_hazards ---');
        const [hazCols] = await connection.query('SHOW COLUMNS FROM master_hazards');
        hazCols.forEach(col => console.log(col.Field));

        console.log('\n--- master_ppe ---');
        const [ppeCols] = await connection.query('SHOW COLUMNS FROM master_ppe');
        ppeCols.forEach(col => console.log(col.Field));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkMasterSchemas();
