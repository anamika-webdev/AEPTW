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

        console.log('Fixing status of Pending permit_extensions...');
        const [result] = await connection.query(`
            UPDATE permit_extensions 
            SET status = 'Extension_Requested' 
            WHERE status = 'Pending'
        `);

        console.log(`✅ Updated ${result.affectedRows} extensions from 'Pending' to 'Extension_Requested'.`);

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
})();
