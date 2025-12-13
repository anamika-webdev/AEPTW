const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Anam@14',
    database: process.env.DB_NAME || 'amazon_eptw_db'
};

async function checkExtensionStatus() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        // Check specific permits from the screenshot
        const serials = ['PTW-0048', 'PTW-0022', 'PTW-0018', 'PTW-0037'];

        console.log(`Checking status for: ${serials.join(', ')}`);

        const [permits] = await connection.query(`
            SELECT id, permit_serial, status, site_leader_id, safety_officer_id 
            FROM permits 
            WHERE permit_serial IN (?)
        `, [serials]);

        console.log('\n--- PERMITS STATUS ---');
        permits.forEach(p => console.log(`${p.permit_serial}: ${p.status}`));

        if (permits.length > 0) {

            const permitIds = permits.map(p => p.id);
            const [extensions] = await connection.query(`
                SELECT 
                    id, permit_id, status, 
                    site_leader_id, site_leader_status, 
                    safety_officer_id, safety_officer_status 
                FROM permit_extensions 
                WHERE permit_id IN (?)
            `, [permitIds]);

            console.log('\n--- PERMIT EXTENSIONS TABLE ---');
            console.log(JSON.stringify(extensions, null, 2));

            // Analyze why they might not be 'Extended'
            extensions.forEach(ext => {
                const slApproved = !ext.site_leader_id || ext.site_leader_status === 'Approved';
                const soApproved = !ext.safety_officer_id || ext.safety_officer_status === 'Approved';
                const isFullyApproved = slApproved && soApproved;

                console.log(`\nExtension ${ext.id} (Permit ${ext.permit_id}):`);
                console.log(`- Site Leader: ${ext.site_leader_id ? ext.site_leader_status : 'N/A'}`);
                console.log(`- Safety Officer: ${ext.safety_officer_id ? ext.safety_officer_status : 'N/A'}`);
                console.log(`- Fully Approved Logic: ${isFullyApproved}`);
                console.log(`- Current Status: ${ext.status}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkExtensionStatus();
