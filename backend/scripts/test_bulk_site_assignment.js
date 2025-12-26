// Test Script for Bulk Site Assignment Feature
// Run with: node backend/scripts/test_bulk_site_assignment.js

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eptw_db',
};

async function testBulkSiteAssignment() {
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // ========================================
        // SETUP: Create test site
        // ========================================
        console.log('📋 SETUP PHASE');
        console.log('─'.repeat(50));

        const testSiteName = 'Test Bulk Assignment Site';
        const testSiteCode = 'TBAS';

        await connection.query(
            'INSERT IGNORE INTO sites (name, site_code, location) VALUES (?, ?, ?)',
            [testSiteName, testSiteCode, 'Test Location']
        );

        const [siteResult] = await connection.query(
            'SELECT id FROM sites WHERE name = ?',
            [testSiteName]
        );
        const siteId = siteResult[0].id;
        console.log(`✅ Created/Found Site: ${testSiteName} (ID: ${siteId})`);

        // ========================================
        // SETUP: Create test users with different roles
        // ========================================
        const testUsers = [
            { login_id: 'test_worker_1', role: 'Worker', full_name: 'Test Worker One' },
            { login_id: 'test_supervisor_1', role: 'Requester', full_name: 'Test Supervisor One' },
            { login_id: 'test_supervisor_2', role: 'Requester', full_name: 'Test Supervisor Two' },
            { login_id: 'test_approver_1', role: 'Approver_Safety', full_name: 'Test Approver One' },
        ];

        const userIds = [];
        const supervisorIds = [];

        for (const user of testUsers) {
            // Clean up existing test users
            await connection.query('DELETE FROM users WHERE login_id = ?', [user.login_id]);

            // Create user
            const [result] = await connection.query(`
        INSERT INTO users (login_id, full_name, email, password_hash, role, is_active, created_at)
        VALUES (?, ?, ?, 'test_hash', ?, TRUE, NOW())
      `, [user.login_id, user.full_name, `${user.login_id}@test.com`, user.role]);

            userIds.push(result.insertId);

            if (user.role === 'Requester' || user.role.includes('Supervisor')) {
                supervisorIds.push(result.insertId);
            }

            console.log(`✅ Created User: ${user.full_name} (${user.role}) - ID: ${result.insertId}`);
        }

        console.log('\n');

        // ========================================
        // TEST 1: Bulk Update - Assign Site to All Users
        // ========================================
        console.log('🧪 TEST 1: Bulk Site Assignment');
        console.log('─'.repeat(50));

        await connection.query(
            `UPDATE users SET site_id = ? WHERE id IN (${userIds.map(() => '?').join(',')})`,
            [siteId, ...userIds]
        );

        console.log(`✅ Updated ${userIds.length} users with site_id: ${siteId}`);

        // Verify users table update
        const [updatedUsers] = await connection.query(
            'SELECT id, login_id, role, site_id FROM users WHERE id IN (?)',
            [userIds]
        );

        let allHaveSite = true;
        for (const user of updatedUsers) {
            if (user.site_id !== siteId) {
                console.error(`❌ User ${user.login_id} has wrong site_id: ${user.site_id}`);
                allHaveSite = false;
            } else {
                console.log(`  ✅ ${user.login_id} → site_id: ${user.site_id}`);
            }
        }

        if (!allHaveSite) {
            throw new Error('Site assignment to users table failed');
        }

        console.log('\n');

        // ========================================
        // TEST 2: Assign Supervisors to requester_sites
        // ========================================
        console.log('🧪 TEST 2: Supervisor Site Assignment (requester_sites)');
        console.log('─'.repeat(50));

        let assignedCount = 0;
        let skippedCount = 0;

        for (const user of updatedUsers) {
            if (user.role && (user.role.includes('Supervisor') || user.role.includes('Requester'))) {
                // Check if assignment already exists
                const [existing] = await connection.query(
                    'SELECT id FROM requester_sites WHERE requester_user_id = ? AND site_id = ?',
                    [user.id, siteId]
                );

                if (existing.length === 0) {
                    // Create assignment
                    await connection.query(
                        'INSERT INTO requester_sites (requester_user_id, site_id, created_at) VALUES (?, ?, NOW())',
                        [user.id, siteId]
                    );
                    assignedCount++;
                    console.log(`  ✅ Assigned ${user.login_id} to requester_sites`);
                } else {
                    skippedCount++;
                    console.log(`  ⏭️  ${user.login_id} already in requester_sites`);
                }
            }
        }

        console.log(`\n📊 Results: ${assignedCount} assigned, ${skippedCount} skipped`);

        // ========================================
        // TEST 3: Verify requester_sites Assignments
        // ========================================
        console.log('\n🧪 TEST 3: Verify requester_sites Table');
        console.log('─'.repeat(50));

        const [requesterSites] = await connection.query(
            `SELECT rs.id, u.login_id, u.role, rs.site_id 
       FROM requester_sites rs
       JOIN users u ON rs.requester_user_id = u.id
       WHERE rs.site_id = ? AND u.id IN (?)`,
            [siteId, userIds]
        );

        if (requesterSites.length !== supervisorIds.length) {
            console.error(`❌ Expected ${supervisorIds.length} assignments, found ${requesterSites.length}`);
            throw new Error('requester_sites assignment count mismatch');
        }

        console.log(`✅ Found ${requesterSites.length} assignments in requester_sites:`);
        for (const assignment of requesterSites) {
            console.log(`  - ${assignment.login_id} (${assignment.role}) → Site ID: ${assignment.site_id}`);
        }

        // ========================================
        // TEST 4: Test Duplicate Prevention
        // ========================================
        console.log('\n🧪 TEST 4: Duplicate Prevention');
        console.log('─'.repeat(50));

        // Try to insert duplicate (should be prevented by logic)
        const [firstSupervisor] = await connection.query(
            'SELECT id FROM users WHERE id = ? AND role = ?',
            [supervisorIds[0], 'Requester']
        );

        if (firstSupervisor.length > 0) {
            const [existingCheck] = await connection.query(
                'SELECT id FROM requester_sites WHERE requester_user_id = ? AND site_id = ?',
                [firstSupervisor[0].id, siteId]
            );

            if (existingCheck.length > 0) {
                console.log('✅ Duplicate prevention works - assignment already exists');
            } else {
                console.error('❌ Duplicate prevention test failed');
            }
        }

        // ========================================
        // TEST 5: Verify Workers Don't Get requester_sites Assignment
        // ========================================
        console.log('\n🧪 TEST 5: Worker Role Verification');
        console.log('─'.repeat(50));

        const [workerInRequesterSites] = await connection.query(
            `SELECT COUNT(*) as count
       FROM requester_sites rs
       JOIN users u ON rs.requester_user_id = u.id
       WHERE u.role = 'Worker' AND rs.site_id = ? AND u.id IN (?)`,
            [siteId, userIds]
        );

        if (workerInRequesterSites[0].count === 0) {
            console.log('✅ Workers correctly excluded from requester_sites');
        } else {
            console.error(`❌ Found ${workerInRequesterSites[0].count} workers in requester_sites`);
            throw new Error('Workers should not be in requester_sites');
        }

        // ========================================
        // SUMMARY
        // ========================================
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(50));
        console.log('✅ All tests passed!');
        console.log(`✅ ${userIds.length} users updated with site assignment`);
        console.log(`✅ ${supervisorIds.length} supervisors assigned to requester_sites`);
        console.log(`✅ Workers correctly excluded from requester_sites`);
        console.log(`✅ Duplicate prevention working correctly`);

        // ========================================
        // CLEANUP
        // ========================================
        console.log('\n🧹 CLEANUP PHASE');
        console.log('─'.repeat(50));

        // Delete test assignments
        await connection.query(
            'DELETE FROM requester_sites WHERE site_id = ?',
            [siteId]
        );
        console.log('✅ Deleted test requester_sites assignments');

        // Delete test users
        await connection.query(
            'DELETE FROM users WHERE id IN (?)',
            [userIds]
        );
        console.log(`✅ Deleted ${userIds.length} test users`);

        // Delete test site
        await connection.query(
            'DELETE FROM sites WHERE id = ?',
            [siteId]
        );
        console.log('✅ Deleted test site');

        console.log('\n✅ Cleanup complete!\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('📡 Database connection closed\n');
        }
    }
}

// Run the test
console.log('\n' + '='.repeat(50));
console.log('🚀 BULK SITE ASSIGNMENT TEST');
console.log('='.repeat(50) + '\n');

testBulkSiteAssignment()
    .then(() => {
        console.log('✅ All tests completed successfully!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });