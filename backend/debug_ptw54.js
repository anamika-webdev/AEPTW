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

        console.log('--- EXTENSIONS FOR PTW-0054 (ID 95) ---');
        const [exts] = await connection.query('SELECT id, permit_id, site_leader_id, safety_officer_id, status, site_leader_status, safety_officer_status FROM permit_extensions WHERE permit_id = 95');
        exts.forEach(e => console.log(`ID:${e.id}, SL:${e.site_leader_id}, SO:${e.safety_officer_id}, STATUS:${e.status}, SL_ST:${e.site_leader_status}, SO_ST:${e.safety_officer_status}`));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
})();
