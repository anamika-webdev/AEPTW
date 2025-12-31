// Script to check and fix user roles
const pool = require('../src/config/database');

async function checkAndFixRoles() {
    try {
        console.log('Checking user roles...\n');

        // Get all users
        const [users] = await pool.query('SELECT id, login_id, full_name, email, role FROM users');

        console.log(`Total users: ${users.length}\n`);

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.login_id} (${user.full_name})`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: "${user.role || 'EMPTY'}"`);
            console.log('');
        });

        // Find users with empty roles
        const usersWithoutRoles = users.filter(u => !u.role || u.role.trim() === '');

        if (usersWithoutRoles.length > 0) {
            console.log(`\n⚠️  Found ${usersWithoutRoles.length} user(s) with empty roles:`);
            usersWithoutRoles.forEach(u => {
                console.log(`   - ${u.login_id} (ID: ${u.id})`);
            });

            console.log('\n💡 To fix, run:');
            console.log(`   UPDATE users SET role = 'Admin' WHERE id = ${usersWithoutRoles[0].id};`);
        } else {
            console.log('\n✅ All users have roles assigned');
        }

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkAndFixRoles();
