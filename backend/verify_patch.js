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

        console.log('--- EXTENSION 1 ---');
        const [extensions] = await connection.query('SELECT id, permit_id, site_leader_id, safety_officer_id, status, site_leader_status, safety_officer_status, requested_at FROM permit_extensions WHERE id = 1');
        extensions.forEach(e => console.log(`ID:${e.id}, PID:${e.permit_id}, SL:${e.site_leader_id}, SO:${e.safety_officer_id}, STATUS:${e.status}, SL_ST:${e.site_leader_status}, SO_ST:${e.safety_officer_status}`));

        console.log('--- PERMIT 5 ---');
        const [permits] = await connection.query('SELECT id, permit_serial, site_leader_id, safety_officer_id FROM permits WHERE id = 5');
        permits.forEach(p => console.log(`ID:${p.id}, Serial:${p.permit_serial}, SL:${p.site_leader_id}, SO:${p.safety_officer_id}`));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
})();
