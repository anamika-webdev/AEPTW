const db = require('../src/config/database');

async function createEvidenceTable() {
    try {
        const connection = await db.getConnection();
        console.log('🔌 Connected to database...');

        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS permit_evidences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        permit_id INT NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        timestamp DATETIME,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (permit_id) REFERENCES permits(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `;

        await connection.query(createTableQuery);
        console.log('✅ Evidence table created successfully');

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    }
}

createEvidenceTable();
