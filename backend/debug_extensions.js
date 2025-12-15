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

        const [permits] = await connection.query('SELECT id, permit_serial, site_leader_id, safety_officer_id FROM permits WHERE id = 5');
        console.log('--- PERMIT 5 ---');
        permits.forEach(p => console.log(`ID:${p.id}, Serial:${p.permit_serial}, SL:${p.site_leader_id}, SO:${p.safety_officer_id}`));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
})();
