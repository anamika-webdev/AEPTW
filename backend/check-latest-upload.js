// Check latest closure evidence
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkLatestEvidence() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'amazon_eptw_db'
    });

    try {
        console.log('🔍 Checking for LATEST closure evidence entries...');

        const [evidence] = await connection.query(`
            SELECT * FROM permit_closure_evidence 
            ORDER BY id DESC 
            LIMIT 5
        `);

        if (evidence.length === 0) {
            console.log('❌ No closure evidence found in the entire table.');
        } else {
            console.log(`✅ Found ${evidence.length} recent evidence records.`);
            console.table(evidence);
        }

        // Also check recent file uploads directory
        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(__dirname, '../uploads/closure');

        console.log(`\n🔍 Checking upload directory: ${uploadDir}`);
        if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            console.log(`📂 Directory contains ${files.length} files.`);
            // Show 5 most recent files
            const recentFiles = files
                .map(file => ({ file, mtime: fs.statSync(path.join(uploadDir, file)).mtime }))
                .sort((a, b) => b.mtime - a.mtime)
                .slice(0, 5);
            console.log('Recent files:', recentFiles);
        } else {
            console.log('❌ Upload directory does not exist!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkLatestEvidence();
