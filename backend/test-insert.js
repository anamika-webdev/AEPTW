// Test DB Insertion logic independently
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testInsert() {
    console.log('🧪 Testing DB Insertion Logic...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'amazon_eptw_db'
    });

    try {
        await connection.beginTransaction();

        const permitId = 108; // PTW-0067
        const userId = 17;    // Test User

        // 1. Create Closure
        console.log('Step 1: Inserting Closure...');
        const [closureResult] = await connection.query(
            `INSERT INTO permit_closure (
                permit_id, closed_by_user_id, housekeeping_done, tools_removed, locks_removed, area_restored, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [permitId, userId, 1, 1, 1, 1, 'Test Remark']
        );
        const closureId = closureResult.insertId;
        console.log('✅ Closure created with ID:', closureId);

        // 2. Insert Evidence
        console.log('Step 2: Inserting Evidence...');
        const filePath = '/uploads/closure/test-file.jpg';
        const category = 'area_organization';
        const description = 'Test Description';
        const timestamp = new Date();
        const latitude = null;
        const longitude = null;

        await connection.query(
            `INSERT INTO permit_closure_evidence (
            closure_id, 
            permit_id, 
            file_path, 
            category,
            description, 
            timestamp, 
            latitude, 
            longitude, 
            captured_by_user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                closureId,
                permitId,
                filePath,
                category,
                description,
                timestamp,
                latitude,
                longitude,
                userId
            ]
        );
        console.log('✅ Evidence Inserted Successfully');

        await connection.rollback(); // Don't actually save test data
        console.log('🔄 Rolled back transaction (Test Passed)');

    } catch (error) {
        console.error('❌ SQL Error:', error.message);
        console.error('Initial SQL:', error.sql);
    } finally {
        await connection.end();
    }
}

testInsert();
