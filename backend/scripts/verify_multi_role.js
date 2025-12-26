const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eptw_db',
};

async function verifyMultiRole() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Verify schema type
        const [columns] = await connection.query(`
      SELECT CHARACTER_MAXIMUM_LENGTH, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role';
    `, [dbConfig.database]);

        console.log('Role Column Type:', columns[0].COLUMN_TYPE);

        if (columns[0].CHARACTER_MAXIMUM_LENGTH < 100) {
            console.error('❌ Role column size too small!');
        } else {
            console.log('✅ Role column size OK.');
        }

        // 2. Create a test multi-role user
        const testLogin = 'multirole_test';
        const testRoles = 'Supervisor,Approver_Safety';

        // Clean up previous run
        await connection.query('DELETE FROM users WHERE login_id = ?', [testLogin]);

        console.log(`Creating test user with roles: ${testRoles}`);
        await connection.query(`
      INSERT INTO users (login_id, full_name, email, password_hash, role, is_active, created_at)
      VALUES (?, 'Multi Role Test', 'multi@test.com', 'hash', ?, TRUE, NOW())
    `, [testLogin, testRoles]);

        // 3. Verify querying logic (simulating backend route logic)
        console.log('Testing queries...');

        // Test: Find as Supervisor
        const [asSupervisor] = await connection.query("SELECT * FROM users WHERE role LIKE '%Supervisor%' AND login_id = ?", [testLogin]);
        console.log(`- Query for 'Supervisor': ${asSupervisor.length > 0 ? '✅ Found' : '❌ Not Found'}`);

        // Test: Find as Approver
        const [asApprover] = await connection.query("SELECT * FROM users WHERE role LIKE '%Approver_Safety%' AND login_id = ?", [testLogin]);
        console.log(`- Query for 'Approver_Safety': ${asApprover.length > 0 ? '✅ Found' : '❌ Not Found'}`);

        // Test: Find as Admin (Should FAIL)
        const [asAdmin] = await connection.query("SELECT * FROM users WHERE role LIKE '%Admin%' AND login_id = ?", [testLogin]);
        console.log(`- Query for 'Admin' (Should fail): ${asAdmin.length === 0 ? '✅ Correctly Not Found' : '❌ Incorrectly Found'}`);

        // Clean up
        await connection.query('DELETE FROM users WHERE login_id = ?', [testLogin]);
        console.log('Test user cleaned up.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

verifyMultiRole();
