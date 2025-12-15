-- Add training_evidence_url column to permit_team_members table
ALTER TABLE permit_team_members 
ADD COLUMN training_evidence_url VARCHAR(500) DEFAULT NULL AFTER contact_number;

-- Or create a separate table for multiple training evidences per worker
CREATE TABLE IF NOT EXISTS worker_training_evidence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_member_id INT NOT NULL,
    permit_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_member_id) REFERENCES permit_team_members(id) ON DELETE CASCADE,
    FOREIGN KEY (permit_id) REFERENCES permits(id) ON DELETE CASCADE,
    INDEX idx_team_member (team_member_id),
    INDEX idx_permit (permit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
