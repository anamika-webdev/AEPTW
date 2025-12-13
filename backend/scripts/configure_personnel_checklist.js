const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Anam@14',
    database: process.env.DB_NAME || 'amazon_eptw_db'
};

const REQUIREMENTS = {
    'General': [
        'Supervisor Name', 'Supervisor Contact',
        'First Aider Name', 'First Aider Contact',
        'AED Certified Person Name', 'AED Certified Person Contact'
    ],
    'Height': [
        'Supervisor Name', 'Supervisor Contact',
        'First Aider Name', 'First Aider Contact',
        'AED Certified Person Name', 'AED Certified Person Contact'
    ],
    'Hot_Work': [
        'Supervisor Name', 'Supervisor Contact',
        'Fire Watcher Name', 'Fire Watcher Contact',
        'Fire Fighter Name', 'Fire Fighter Contact',
        'First Aider Name', 'First Aider Contact',
        'AED Certified Person Name', 'AED Certified Person Contact'
    ],
    'Electrical': [
        'Supervisor Name', 'Supervisor Contact',
        'Fire Fighter Name', 'Fire Fighter Contact',
        'First Aider Name', 'First Aider Contact',
        'AED Certified Person Name', 'AED Certified Person Contact'
    ],
    'Confined_Space': [
        'Supervisor Name', 'Supervisor Contact',
        'Entrant Name', 'Entrant Contact',
        'Attendant Name', 'Attendant Contact',
        'Stand-by Person Name', 'Stand-by Person Contact'
    ]
};

async function configureChecklist() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        for (const [permitType, questions] of Object.entries(REQUIREMENTS)) {
            console.log(`\nConfiguring ${permitType}...`);

            // Get max display_order
            const [rows] = await connection.query(`
                SELECT MAX(display_order) as maxOrder 
                FROM master_checklist_questions 
                WHERE permit_type = ?
            `, [permitType]);

            let currentOrder = (rows[0].maxOrder || 0) + 1;

            for (const qText of questions) {
                // Check if exists
                const [existing] = await connection.query(`
                    SELECT id FROM master_checklist_questions 
                    WHERE permit_type = ? AND question_text = ?
                `, [permitType, qText]);

                if (existing.length === 0) {
                    await connection.query(`
                        INSERT INTO master_checklist_questions 
                        (permit_type, category, question_text, response_type, is_mandatory, display_order, is_active)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [permitType, 'Personnel Requirements', qText, 'text', true, currentOrder++, true]);
                    console.log(`✅ Added: ${qText}`);
                } else {
                    console.log(`🔹 Exists: ${qText}`);
                }
            }
        }

        console.log('\nConfiguration complete.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

configureChecklist();
