// Test script to check database for training evidence
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'amazon_eptw_db'
    });

    try {
        const results = {};

        console.log('🔍 Checking worker_training_evidence table...');
        const [rows] = await connection.query('SELECT * FROM worker_training_evidence ORDER BY id DESC LIMIT 10');
        results.training_evidence = rows;
        console.log(`Found ${rows.length} training evidence records`);

        console.log('\n🔍 Checking permit_closure_evidence table...');
        const [closureRows] = await connection.query('SELECT * FROM permit_closure_evidence ORDER BY id DESC LIMIT 10');
        results.closure_evidence = closureRows;
        console.log(`Found ${closureRows.length} closure evidence records`);

        console.log('\n🔍 Checking permit_team_members for permit 108 and 109...');
        const [members] = await connection.query('SELECT id, permit_id, worker_name FROM permit_team_members WHERE permit_id IN (108, 109) ORDER BY permit_id, id');
        results.team_members = members;
        console.log(`Found ${members.length} team members`);

        // Write to file
        const fs = require('fs');
        fs.writeFileSync('db-check-results.json', JSON.stringify(results, null, 2));
        console.log('\n✅ Results written to db-check-results.json');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkDatabase();
