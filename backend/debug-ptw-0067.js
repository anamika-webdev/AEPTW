// Check evidence for PTW-0067
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSpecificPermit() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'amazon_eptw_db'
    });

    try {
        console.log('🔍 Checking PTW-0067...');
        // Find ID for PTW-0067
        const [permits] = await connection.query('SELECT id, permit_serial, status FROM permits WHERE permit_serial = "PTW-0067"');

        if (permits.length === 0) {
            console.log('❌ PTW-0067 not found');
            return;
        }

        const permitId = permits[0].id;
        console.log(`✅ Found PTW-0067 (ID: ${permitId})`);

        // Check closure evidence
        const [evidence] = await connection.query('SELECT * FROM permit_closure_evidence WHERE permit_id = ?', [permitId]);
        console.log(`📸 Found ${evidence.length} closure evidence images`);
        console.table(evidence);

        // Check closure record for remarks/signature
        const [closure] = await connection.query('SELECT remarks FROM permit_closure WHERE permit_id = ?', [permitId]);
        if (closure.length > 0) {
            console.log('📝 Closure Remarks found.');
            console.log('--- Content Start ---');
            console.log(closure[0].remarks.substring(0, 100) + '...'); // Print start to verify structure
            console.log('--- Content End ---');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkSpecificPermit();
