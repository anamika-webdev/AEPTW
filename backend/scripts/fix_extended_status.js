const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Anam@14',
    database: process.env.DB_NAME || 'amazon_eptw_db'
};

async function fixExtendedStatus() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Finding permits with mismatching status...');

        // Find permits that are 'Extension_Requested' but have an 'Extended' extension record
        const [rows] = await connection.query(`
            SELECT p.id, p.permit_serial, p.status as permit_status, pe.status as extension_status
            FROM permits p
            JOIN permit_extensions pe ON p.id = pe.permit_id
            WHERE pe.status = 'Extended' 
            AND p.status = 'Extension_Requested'
        `);

        if (rows.length === 0) {
            console.log('No inconsistent permits found.');
        } else {
            console.log(`Found ${rows.length} inconsistent permits:`);
            rows.forEach(r => console.log(`- ${r.permit_serial}: Permit=${r.permit_status}, Extension=${r.extension_status}`));

            console.log('Fixing status...');
            const [result] = await connection.query(`
                UPDATE permits p
                JOIN permit_extensions pe ON p.id = pe.permit_id
                SET p.status = 'Extended'
                WHERE pe.status = 'Extended' 
                AND p.status = 'Extension_Requested'
            `);

            console.log(`Updated ${result.affectedRows} permits to 'Extended' status.`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

fixExtendedStatus();
