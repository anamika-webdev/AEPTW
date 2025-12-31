// Script to fix users with empty roles
const pool = require('../src/config/database');

async function fixEmptyRoles() {
    try {
        console.log('Fixing users with empty roles...\n');

        // Update users with NULL or empty roles to 'Admin'
        const [result] = await pool.query(`
      UPDATE users 
      SET role = 'Admin' 
      WHERE role IS NULL OR role = ''
    `);

        console.log(`✅ Updated ${result.affectedRows} user(s) to have Admin role\n`);

        // Show updated users
        const [users] = await pool.query(`
      SELECT id, login_id, full_name, role 
      FROM users 
      ORDER BY id DESC 
      LIMIT 5
    `);

        console.log('Recent users:');
        users.forEach(u => {
            console.log(`  ${u.login_id}: ${u.role}`);
        });

        await pool.end();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixEmptyRoles();
