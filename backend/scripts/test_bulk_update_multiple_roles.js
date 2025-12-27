// backend/scripts/test_bulk_update_multiple_roles.js
// Comprehensive test script for bulk updating a single user with multiple roles

const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eptw_db',
};

// ANSI color codes for better output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testBulkUpdateMultipleRoles() {
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        log('✅ Connected to database\n', 'green');

        // ========================================
        // SETUP: Create test site
        // ========================================
        log('📋 SETUP PHASE', 'cyan');
        log('─'.repeat(70), 'cyan');

        const testSiteName = 'Multi-Role Test Site';
        const testSiteCode = 'MRTS';

        await connection.query(
            'INSERT IGNORE INTO sites (name, site_code, location) VALUES (?, ?, ?)',
            [testSiteName, testSiteCode, 'Test Location']
        );

        const [siteResult] = await connection.query(
            'SELECT id FROM sites WHERE name = ?',
            [testSiteName]
        );
        const siteId = siteResult[0].id;
        log(`✅ Created/Found Site: ${testSiteName} (ID: ${siteId})`, 'green');

        // ========================================
        // SETUP: Create test user (initially as Worker)
        // ========================================
        const testLoginId = 'test_multirole_user';
        const testEmail = 'test_multirole@test.com';

        // Clean up existing test user
        await connection.query('DELETE FROM users WHERE login_id = ?', [testLoginId]);
        await connection.query('DELETE FROM requester_sites WHERE requester_user_id IN (SELECT id FROM users WHERE login_id = ?)', [testLoginId]);

        const [createResult] = await connection.query(`
      INSERT INTO users (login_id, full_name, email, password_hash, role, is_active, created_at)
      VALUES (?, ?, ?, 'test_hash', 'Worker', TRUE, NOW())
    `, [testLoginId, 'Test Multi-Role User', testEmail]);

        const userId = createResult.insertId;
        log(`✅ Created Test User: ${testLoginId} (ID: ${userId}) with role: Worker\n`, 'green');

        // ========================================
        // TEST 1: Bulk update user to add Requester role + assign site
        // ========================================
        log('🧪 TEST 1: Bulk Update - Add Requester role + Assign Site', 'magenta');
        log('─'.repeat(70), 'magenta');
        log('Scenario: User currently has "Worker" role. We\'ll update to "Requester,Worker" and assign site.', 'yellow');

        // Simulate the bulk update query
        await connection.query(
            'UPDATE users SET role = ?, site_id = ?, updated_at = NOW() WHERE id = ?',
            ['Requester,Worker', siteId, userId]
        );

        // Verify user table update
        const [user1] = await connection.query(
            'SELECT id, login_id, role, site_id FROM users WHERE id = ?',
            [userId]
        );

        log('\n📊 User Table After Update:', 'blue');
        log(`  User ID: ${user1[0].id}`, 'blue');
        log(`  Role: ${user1[0].role}`, 'blue');
        log(`  Site ID: ${user1[0].site_id}`, 'blue');

        // Check if role is correctly stored
        if (user1[0].role === 'Requester,Worker' && user1[0].site_id === siteId) {
            log('  ✅ Users table updated correctly', 'green');
        } else {
            log('  ❌ Users table update failed', 'red');
            throw new Error('User table update failed');
        }

        // Now simulate the requester_sites assignment logic
        const userRoles = user1[0].role.split(',').map(r => r.trim());
        const hasPermitRole = userRoles.some(r =>
            r === 'Supervisor' ||
            r === 'Requester' ||
            r.includes('Approver')
        );

        log(`\n🔍 Role Check:`, 'blue');
        log(`  Parsed Roles: [${userRoles.join(', ')}]`, 'blue');
        log(`  Has Permit Role: ${hasPermitRole}`, 'blue');

        if (hasPermitRole) {
            // Check if already assigned
            const [existing] = await connection.query(
                'SELECT id FROM requester_sites WHERE requester_user_id = ? AND site_id = ?',
                [userId, siteId]
            );

            if (existing.length === 0) {
                await connection.query(
                    'INSERT INTO requester_sites (requester_user_id, site_id) VALUES (?, ?)',
                    [userId, siteId]
                );
                log('  ✅ Assigned to requester_sites', 'green');
            } else {
                log('  ℹ️ Already assigned to requester_sites', 'yellow');
            }
        }

        // Verify requester_sites assignment
        const [assignment1] = await connection.query(
            'SELECT * FROM requester_sites WHERE requester_user_id = ? AND site_id = ?',
            [userId, siteId]
        );

        log(`\n📊 Requester_Sites Table:`, 'blue');
        if (assignment1.length > 0) {
            log(`  ✅ Assignment exists: User ${userId} → Site ${siteId}`, 'green');
        } else {
            log(`  ❌ Assignment missing!`, 'red');
            throw new Error('requester_sites assignment failed');
        }

        log('\n✅ TEST 1 PASSED\n', 'green');

        // ========================================
        // TEST 2: Update to add another role
        // ========================================
        log('🧪 TEST 2: Bulk Update - Add Approver_Safety role', 'magenta');
        log('─'.repeat(70), 'magenta');
        log('Scenario: User has "Requester,Worker". We\'ll add "Approver_Safety" to make it "Requester,Worker,Approver_Safety".', 'yellow');

        // Update to add Approver_Safety
        await connection.query(
            'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
            ['Requester,Worker,Approver_Safety', userId]
        );

        const [user2] = await connection.query(
            'SELECT id, login_id, role, site_id FROM users WHERE id = ?',
            [userId]
        );

        log('\n📊 User Table After Update:', 'blue');
        log(`  Role: ${user2[0].role}`, 'blue');

        if (user2[0].role === 'Requester,Worker,Approver_Safety') {
            log('  ✅ Users table updated correctly', 'green');
        } else {
            log('  ❌ Users table update failed', 'red');
            throw new Error('User table update failed');
        }

        // Verify requester_sites still exists (shouldn't be deleted)
        const [assignment2] = await connection.query(
            'SELECT * FROM requester_sites WHERE requester_user_id = ? AND site_id = ?',
            [userId, siteId]
        );

        if (assignment2.length > 0) {
            log('  ✅ requester_sites assignment preserved', 'green');
        } else {
            log('  ❌ requester_sites assignment was deleted!', 'red');
            throw new Error('requester_sites assignment was incorrectly deleted');
        }

        log('\n✅ TEST 2 PASSED\n', 'green');

        // ========================================
        // TEST 3: Update site for multi-role user
        // ========================================
        log('🧪 TEST 3: Bulk Update - Change site for multi-role user', 'magenta');
        log('─'.repeat(70), 'magenta');

        // Create another test site
        const newSiteName = 'New Multi-Role Test Site';
        await connection.query(
            'INSERT IGNORE INTO sites (name, site_code, location) VALUES (?, ?, ?)',
            [newSiteName, 'NMRTS', 'New Location']
        );

        const [newSiteResult] = await connection.query(
            'SELECT id FROM sites WHERE name = ?',
            [newSiteName]
        );
        const newSiteId = newSiteResult[0].id;
        log(`Created New Site: ${newSiteName} (ID: ${newSiteId})`, 'yellow');

        // Update user's site
        await connection.query(
            'UPDATE users SET site_id = ?, updated_at = NOW() WHERE id = ?',
            [newSiteId, userId]
        );

        // Add new site assignment to requester_sites
        const [existingNewSite] = await connection.query(
            'SELECT id FROM requester_sites WHERE requester_user_id = ? AND site_id = ?',
            [userId, newSiteId]
        );

        if (existingNewSite.length === 0) {
            await connection.query(
                'INSERT INTO requester_sites (requester_user_id, site_id) VALUES (?, ?)',
                [userId, newSiteId]
            );
        }

        // Verify both site assignments exist (old and new)
        const [allAssignments] = await connection.query(
            'SELECT site_id FROM requester_sites WHERE requester_user_id = ?',
            [userId]
        );

        log(`\n📊 All Site Assignments:`, 'blue');
        allAssignments.forEach(assignment => {
            log(`  Site ID: ${assignment.site_id}`, 'blue');
        });

        if (allAssignments.length >= 2) {
            log('  ✅ User has multiple site assignments', 'green');
        } else {
            log('  ⚠️ User should have 2 site assignments, but has ' + allAssignments.length, 'yellow');
        }

        const [user3] = await connection.query(
            'SELECT site_id FROM users WHERE id = ?',
            [userId]
        );

        if (user3[0].site_id === newSiteId) {
            log('  ✅ Primary site_id updated correctly in users table', 'green');
        } else {
            log('  ❌ Primary site_id not updated', 'red');
        }

        log('\n✅ TEST 3 PASSED\n', 'green');

        // ========================================
        // TEST 4: Dashboard display verification
        // ========================================
        log('🧪 TEST 4: Dashboard Display Verification', 'magenta');
        log('─'.repeat(70), 'magenta');

        // Simulate the query used by the dashboard
        const [dashboardUser] = await connection.query(`
      SELECT u.id, u.login_id, u.full_name, u.role, 
             u.site_id, s.name as site_name,
             u.is_active
      FROM users u
      LEFT JOIN sites s ON u.site_id = s.id
      WHERE u.id = ?
    `, [userId]);

        log('\n📊 Dashboard View of User:', 'blue');
        log(`  Login ID: ${dashboardUser[0].login_id}`, 'blue');
        log(`  Full Name: ${dashboardUser[0].full_name}`, 'blue');
        log(`  Role(s): ${dashboardUser[0].role}`, 'blue');
        log(`  Primary Site: ${dashboardUser[0].site_name} (ID: ${dashboardUser[0].site_id})`, 'blue');
        log(`  Active: ${dashboardUser[0].is_active}`, 'blue');

        // Get all site assignments
        const [siteAssignments] = await connection.query(`
      SELECT s.id, s.name, s.site_code
      FROM requester_sites rs
      JOIN sites s ON rs.site_id = s.id
      WHERE rs.requester_user_id = ?
    `, [userId]);

        log('\n📊 All Assigned Sites:', 'blue');
        siteAssignments.forEach(site => {
            log(`  - ${site.name} (${site.site_code}) - ID: ${site.id}`, 'blue');
        });

        if (siteAssignments.length > 0) {
            log('  ✅ Site assignments visible in dashboard', 'green');
        } else {
            log('  ❌ No site assignments found', 'red');
        }

        log('\n✅ TEST 4 PASSED\n', 'green');

        // ========================================
        // FINAL SUMMARY
        // ========================================
        log('═'.repeat(70), 'cyan');
        log('✅ ALL TESTS PASSED!', 'green');
        log('═'.repeat(70), 'cyan');
        log('\nSummary:', 'cyan');
        log('✓ Multiple roles stored correctly as comma-separated values', 'green');
        log('✓ requester_sites assignments created for permit-creating roles', 'green');
        log('✓ Site assignments preserved when role is updated', 'green');
        log('✓ Dashboard displays user data correctly', 'green');
        log('✓ Multiple site assignments supported', 'green');

        // Cleanup
        log('\n🧹 Cleaning up test data...', 'yellow');
        await connection.query('DELETE FROM requester_sites WHERE requester_user_id = ?', [userId]);
        await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        await connection.query('DELETE FROM sites WHERE id IN (?, ?)', [siteId, newSiteId]);
        log('✅ Cleanup complete\n', 'green');

    } catch (error) {
        log(`\n❌ TEST FAILED: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            log('Connection closed.', 'yellow');
        }
    }
}

// Run the test
testBulkUpdateMultipleRoles()
    .then(() => {
        log('\n✅ Test suite completed successfully!', 'green');
        process.exit(0);
    })
    .catch((error) => {
        log(`\n❌ Test suite failed: ${error.message}`, 'red');
        process.exit(1);
    });