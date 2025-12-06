const db = require('../src/config/database');

async function createNotificationsTable() {
    try {
        const connection = await db.getConnection();
        console.log('🔌 Connected to database...');

        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        related_permit_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

        await connection.query(createTableQuery);
        console.log('✅ Notifications table created successfully');

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
}

createNotificationsTable();
