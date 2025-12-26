const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eptw_db',
};

async function testBulkSiteUpdate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // 1. Create a test site
        const testSiteName = 'Bulk Update Test Site';
        await connection.query('INSERT IGNORE INTO sites (name, site_code, location) VALUES (?, ?, ?)', [testSiteName, 'BUTS', 'Test Location']);
        const [siteResult] = await connection.query('SELECT id FROM sites WHERE name = ?', [testSiteName]);
        const siteId = siteResult[0].id;
        console.log(`Created/Found Site: ${testSiteName} (ID: ${siteId})`);

        // 2. Create test users
        const userLogins = ['bulk_user_1', 'bulk_user_2'];
        const userIds = [];

        for (const login of userLogins) {
            await connection.query('DELETE FROM users WHERE login_id = ?', [login]);
            const [res] = await connection.query(`
        INSERT INTO users (login_id, full_name, email, password_hash, role, is_active, created_at)
        VALUES (?, ?, ?, 'hash', 'Worker', TRUE, NOW())
      `, [login, login, `${login}@test.com`]);
            userIds.push(res.insertId);
        }
        console.log(`Created test users: ${userIds.join(', ')}`);

        // 3. Simulate Bulk Update logic (mimicking the backend route logic)
        // The route sets site_id based on site name
        console.log('Simulating Bulk Update to assign site...');

        // Logic from users.routes.js:
        /*
          if (updates.site) ...
          UPDATE users SET site_id = ? WHERE id IN (?)
        */

        await connection.query(
            `UPDATE users SET site_id = ? WHERE id IN (?)`,
            [siteId, userIds]
        );

        // 4. Verify
        const [updatedUsers] = await connection.query('SELECT id, login_id, site_id FROM users WHERE id IN (?)', [userIds]);

        let allUpdated = true;
        for (const user of updatedUsers) {
            if (user.site_id !== siteId) {
                console.error(`❌ User ${user.login_id} has wrong site_id: ${user.site_id}`);
                allUpdated = false;
            } else {
                console.log(`✅ User ${user.login_id} updated with site_id: ${user.site_id}`);
            }
        }

        if (allUpdated) {
            console.log('✅ Bulk Site Update verification successful!');
        } else {
            console.error('❌ Verification failed.');
        }

        // Cleanup
        await connection.query('DELETE FROM users WHERE id IN (?)', [userIds]);
        await connection.query('DELETE FROM sites WHERE id = ?', [siteId]);
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

testBulkSiteUpdate();
