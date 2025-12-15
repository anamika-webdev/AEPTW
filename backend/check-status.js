// Check file creation and ptw status
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function checkStatus() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'amazon_eptw_db'
    });

    try {
        // Check PTW-0067 status
        const [rows] = await connection.query('SELECT id, status FROM permits WHERE permit_serial = "PTW-0067"');
        console.log('PTW-0067:', rows);

        // Check Uploads
        const uploadDir = path.join(__dirname, 'uploads/closure');
        console.log(`Checking ${uploadDir}...`);

        if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            const recentFiles = files.filter(f => {
                const stats = fs.statSync(path.join(uploadDir, f));
                const age = (Date.now() - stats.mtimeMs) / 1000;
                return age < 600; // Last 10 minutes
            });
            console.log(`Found ${recentFiles.length} files created in last 10 minutes:`);
            console.log(recentFiles);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkStatus();
