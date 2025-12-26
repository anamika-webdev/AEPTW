const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eptw_db',
};

async function checkUserCounts() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const [rows] = await connection.query(`
      SELECT role, count(*) as count 
      FROM users 
      GROUP BY role
    `);

        console.log('User Counts by Role (JSON):');
        console.log(JSON.stringify(rows, null, 2));

        const [approvers] = await connection.query(`
      SELECT id, full_name, role 
      FROM users 
      WHERE role LIKE '%Approv%'
    `);

        console.log(`Total 'Approver' matches: ${approvers.length}`);
        console.log(JSON.stringify(approvers, null, 2));


    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkUserCounts();
