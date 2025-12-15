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

        const [users] = await connection.query("SELECT id, full_name, role FROM users WHERE role LIKE '%Approver%' OR role LIKE '%Safety%' OR role LIKE '%Leader%'");
        console.log('--- POTENTIAL APPROVERS ---');
        users.forEach(u => console.log(`ID:${u.id}, Name:${u.full_name}, Role:${u.role}`));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
})();
