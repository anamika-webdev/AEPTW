// Check for closed permits and their closure records
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkClosures() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'amazon_eptw_db'
    });

    try {
        const results = {};

        console.log('🔍 Checking for closed permits...');
        const [closedPermits] = await connection.query(`
            SELECT id, permit_serial, status, created_at, updated_at 
            FROM permits 
            WHERE status = 'Closed' 
            ORDER BY updated_at DESC 
            LIMIT 5
        `);
        results.closed_permits = closedPermits;
        console.log(`Found ${closedPermits.length} closed permits`);

        console.log('\n🔍 Checking permit_closure table...');
        const [closures] = await connection.query(`
            SELECT * FROM permit_closure 
            ORDER BY closed_at DESC 
            LIMIT 5
        `);
        results.closures = closures;
        console.log(`Found ${closures.length} closure records`);

        console.log('\n🔍 Checking permit_closure_evidence table...');
        const [evidence] = await connection.query(`
            SELECT * FROM permit_closure_evidence 
            ORDER BY timestamp DESC 
            LIMIT 10
        `);
        results.closure_evidence = evidence;
        console.log(`Found ${evidence.length} closure evidence records`);

        // Write to file
        const fs = require('fs');
        fs.writeFileSync('closure-check-results.json', JSON.stringify(results, null, 2));
        console.log('\n✅ Results written to closure-check-results.json');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkClosures();
