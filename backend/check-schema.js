// Check schema of permit_closure_evidence
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'amazon_eptw_db'
    });

    try {
        console.log('🔍 Checking schema of permit_closure_evidence...');
        const [columns] = await connection.query('DESCRIBE permit_closure_evidence');

        fs.writeFileSync('schema-check.json', JSON.stringify(columns, null, 2));
        console.log('✅ Schema written to schema-check.json');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkSchema();
