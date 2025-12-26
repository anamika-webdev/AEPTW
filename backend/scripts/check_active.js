const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eptw_db',
};

async function checkActiveStatus() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        const [active] = await connection.query(`
      SELECT count(*) as count FROM users WHERE role LIKE '%Approver%' AND is_active = TRUE
    `);

        const [inactive] = await connection.query(`
      SELECT count(*) as count FROM users WHERE role LIKE '%Approver%' AND is_active = FALSE
    `);

        console.log(`Active Approvers: ${active[0].count}`);
        console.log(`Inactive Approvers: ${inactive[0].count}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkActiveStatus();
