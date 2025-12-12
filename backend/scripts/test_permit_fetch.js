const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Anam@14',
    database: process.env.DB_NAME || 'amazon_eptw_db'
};

async function testPermitFetch() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Finding a permit with extension request...');
        const [extensions] = await connection.query('SELECT * FROM permit_extensions LIMIT 1');

        if (extensions.length === 0) {
            console.log('No extensions found.');
            return;
        }

        const ext = extensions[0];
        const permitId = ext.permit_id;
        console.log(`Testing fetch for Permit ID: ${permitId} (from Extension ID: ${ext.id})`);

        // Simulate the main query from permits.routes.js
        console.log('1. Executing Main Permit Query...');
        const [permits] = await connection.query(`
            SELECT 
                p.*,
                s.name as site_name,
                s.site_code,
                u.full_name as created_by_name
            FROM permits p
            LEFT JOIN sites s ON p.site_id = s.id
            LEFT JOIN users u ON p.created_by_user_id = u.id
            WHERE p.id = ?
        `, [permitId]);

        if (permits.length === 0) {
            console.log('❌ Permit not found!');
        } else {
            console.log('✅ Permit found:', permits[0].permit_serial);
        }

        // Simulate Checklist Query (Common failure point)
        console.log('2. Executing Checklist Query...');
        try {
            const [responses] = await connection.query(`
                SELECT 
                  cr.id,
                  mq.question,
                  cr.response,
                  cr.remarks
                FROM permit_checklist_responses cr
                JOIN master_checklist_questions mq ON cr.question_id = mq.id
                WHERE cr.permit_id = ?
            `, [permitId]);
            console.log(`✅ Checklist responses: ${responses.length}`);
        } catch (err) {
            console.error('❌ Checklist Query Failed:', err.message);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

testPermitFetch();
