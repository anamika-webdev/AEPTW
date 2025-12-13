const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Anam@14',
    database: process.env.DB_NAME || 'amazon_eptw_db'
};

async function addQuestions() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        const questions = [
            { text: 'Fire Watcher Name', type: 'text' },
            { text: 'Fire Fighter Name', type: 'text' },
            { text: 'First Aider Name', type: 'text' },
            { text: 'AED Certified Person Name', type: 'text' },
            { text: 'Supervisor Name', type: 'text' },
            { text: 'Supervisor Contact Detail', type: 'text' }
        ];

        console.log('Adding Hot Work checklist questions...');

        // Get the current max display_order
        const [rows] = await connection.query(`
            SELECT MAX(display_order) as maxOrder 
            FROM master_checklist_questions 
            WHERE permit_type = 'Hot_Work'
        `);

        let initialOrder = (rows[0].maxOrder || 0) + 1;

        for (const q of questions) {
            // Check if exists
            const [existing] = await connection.query(`
                SELECT id FROM master_checklist_questions 
                WHERE permit_type = 'Hot_Work' AND question_text = ?
            `, [q.text]);

            if (existing.length === 0) {
                await connection.query(`
                    INSERT INTO master_checklist_questions 
                    (permit_type, category, question_text, response_type, is_mandatory, display_order, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, ['Hot_Work', 'Personnel Requirements', q.text, q.type, true, initialOrder++, true]);
                console.log(`✅ Added: ${q.text}`);
            } else {
                console.log(`⚠️ Already exists: ${q.text}`);
            }
        }

        console.log('Done.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

addQuestions();
