const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eptw_db',
};

const DEPARTMENTS = [
    "ACES",
    "FCD",
    "IB",
    "ICQA",
    "IT",
    "L&D",
    "Last Mile",
    "OB",
    "Operations",
    "Ops",
    "PXT",
    "RME",
    "Site Lead",
    "SLP",
    "Surface",
    "WHS"
];

async function seedDepartments() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Check if departments table exists
        const [tables] = await connection.query(`
      SHOW TABLES LIKE 'departments'
    `);

        if (tables.length === 0) {
            console.log('Creating departments table...');
            await connection.query(`
        CREATE TABLE departments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
            console.log('✅ departments table created.');
        }

        console.log('Seeding departments...');
        for (const DeptName of DEPARTMENTS) {
            try {
                await connection.query(`
          INSERT IGNORE INTO departments (name, is_active) VALUES (?, TRUE)
        `, [DeptName]);
            } catch (err) {
                console.error(`Error inserting ${DeptName}:`, err.message);
            }
        }

        console.log('✅ Departments seeded successfully.');

    } catch (error) {
        console.error('Error updating database:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

seedDepartments();
