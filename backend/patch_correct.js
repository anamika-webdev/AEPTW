const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

(async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('--- CORRECTING APPROVERS FOR PERMIT 5 / EXTENSION 1 ---');

        // Site Leader = 6 (Vikram)
        // Safety Officer = 22 (Ram)

        // Update Permit 5
        console.log('Updating Permit 5...');
        await connection.query('UPDATE permits SET site_leader_id = 6, safety_officer_id = 22 WHERE id = 5');

        // Update Extension 1
        console.log('Updating Extension 1...');
        await connection.query(`
            UPDATE permit_extensions 
            SET 
                site_leader_id = 6, 
                safety_officer_id = 22, 
                status = 'Extension_Requested',
                site_leader_status = 'Pending',
                safety_officer_status = 'Pending'
            WHERE id = 1
        `);

        console.log('✅ Data patched correctly.');

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
})();
