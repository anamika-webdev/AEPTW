// Reset PTW-0067 to Active
require('dotenv').config();
const mysql = require('mysql2/promise');

async function resetPermit() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'amazon_eptw_db'
    });

    try {
        console.log('🔄 Resetting PTW-0067 to status "Active"...');

        // Find ID
        const [permits] = await connection.query('SELECT id FROM permits WHERE permit_serial = "PTW-0067"');
        if (permits.length === 0) {
            console.log('Permit not found');
            return;
        }
        const id = permits[0].id;

        // Delete closure evidence
        await connection.query('DELETE FROM permit_closure_evidence WHERE permit_id = ?', [id]);

        // Delete closure record
        await connection.query('DELETE FROM permit_closure WHERE permit_id = ?', [id]);

        // Update status
        await connection.query('UPDATE permits SET status = "Active" WHERE id = ?', [id]);

        console.log('✅ PTW-0067 reset successfully. You can now Close it again.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

resetPermit();
