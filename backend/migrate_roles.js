const pool = require('./src/config/database');

async function migrateRoles() {
    try {
        console.log('🔄 Migrating roles...');

        // Update users table
        const [userResult] = await pool.query(
            `UPDATE users SET role = REPLACE(role, 'Approver_AreaManager', 'Approver_AreaOwner') WHERE role LIKE '%Approver_AreaManager%'`
        );
        console.log(`✅ Updated ${userResult.affectedRows} users.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateRoles();
