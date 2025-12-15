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

        // Update Permit 5
        console.log('Updating Permit 5...');
        await connection.query('UPDATE permits SET site_leader_id = 22, safety_officer_id = 2 WHERE id = 5');

        // Update Extension 1 (assuming it is for Permit 5)
        console.log('Updating Extension 1...');
        await connection.query('UPDATE permit_extensions SET site_leader_id = 22, safety_officer_id = 2, status = "Extension_Requested" WHERE id = 1');

        console.log('✅ Data patched successfully.');

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
})();
