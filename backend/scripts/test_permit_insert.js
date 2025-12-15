const mysql = require('mysql2/promise');
require('dotenv').config();

async function testPermitInsert() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Anam@14',
            database: process.env.DB_NAME || 'amazon_eptw_db'
        });

        console.log('✅ Connected to database\n');

        // Check permits table structure
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'permits'
            ORDER BY ORDINAL_POSITION
        `);

        console.log('📋 Permits table columns:');
        columns.forEach((col, idx) => {
            console.log(`  ${idx + 1}. ${col.COLUMN_NAME}`);
        });
        console.log(`\n📊 Total columns: ${columns.length}\n`);

        // Test a minimal insert
        console.log('🧪 Testing minimal INSERT...');
        const testData = {
            permit_serial: 'TEST-9999',
            site_id: 1,
            permit_type: 'General',
            work_description: 'Test',
            work_location: 'Test Location',
            start_time: new Date(),
            end_time: new Date(Date.now() + 86400000),
            created_by_user_id: 1,
            status: 'Initiated'
        };

        try {
            const [result] = await connection.query(`
                INSERT INTO permits (
                    permit_serial, site_id, permit_type, work_description, 
                    work_location, start_time, end_time, created_by_user_id, 
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
                testData.permit_serial,
                testData.site_id,
                testData.permit_type,
                testData.work_description,
                testData.work_location,
                testData.start_time,
                testData.end_time,
                testData.created_by_user_id,
                testData.status
            ]);

            console.log(`✅ Test INSERT successful! ID: ${result.insertId}`);

            // Clean up test data
            await connection.query('DELETE FROM permits WHERE permit_serial = ?', [testData.permit_serial]);
            console.log('🧹 Test data cleaned up');

        } catch (insertError) {
            console.error('❌ INSERT failed:', insertError.message);
            console.error('SQL Error Code:', insertError.code);
            console.error('SQL State:', insertError.sqlState);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

testPermitInsert();
