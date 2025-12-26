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

        console.log('User Counts by Role:');
        console.table(rows);

        // Also check for any roles that might be variations like 'Approver_safety' (lowercase)
        const [approvers] = await connection.query(`
        SELECT id, full_name, role 
        FROM users 
        WHERE role LIKE '%Approver%' OR role LIKE '%Safety%' OR role LIKE '%Manager%' OR role LIKE '%Leader%'
    `);

        console.log(`Total potential approvers found: ${approvers.length}`);
        if (approvers.length < 50) {
            console.table(approvers);
        } else {
            console.log("Too many to list, first 10:");
            console.table(approvers.slice(0, 10));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkUserCounts();
