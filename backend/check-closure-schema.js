// Check schema of permit_closure
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkClosureSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'amazon_eptw_db'
    });

    try {
        console.log('🔍 Checking schema of permit_closure...');
        const [columns] = await connection.query('DESCRIBE permit_closure');
        console.table(columns);
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkClosureSchema();
