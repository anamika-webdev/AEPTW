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

        console.log('Updating Extension 1 Status to Pending...');
        await connection.query(`
            UPDATE permit_extensions 
            SET 
                site_leader_status = 'Pending', 
                safety_officer_status = 'Pending',
                status = 'Extension_Requested'
            WHERE id = 1
        `);

        console.log('✅ Extension 1 status patched to Pending.');

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
})();
