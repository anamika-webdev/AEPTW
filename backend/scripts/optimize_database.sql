-- Database Performance Optimization Script
-- Run this to add indexes and optimize queries

USE amazon_eptw_db;

-- ============= PERFORMANCE INDEXES =============

-- Permits table indexes
ALTER TABLE permits 
  ADD INDEX idx_status (status),
  ADD INDEX idx_site_id (site_id),
  ADD INDEX idx_created_by (created_by_user_id),
  ADD INDEX idx_created_at (created_at),
  ADD INDEX idx_permit_serial (permit_serial),
  ADD INDEX idx_status_site (status, site_id);

-- Users table indexes
ALTER TABLE users 
  ADD INDEX idx_email (email),
  ADD INDEX idx_role (role),
  ADD INDEX idx_login_id (login_id);

-- Sites table indexes
ALTER TABLE sites 
  ADD INDEX idx_site_code (site_code),
  ADD INDEX idx_name (name);

-- Permit team members indexes
ALTER TABLE permit_team_members 
  ADD INDEX idx_permit_id (permit_id),
  ADD INDEX idx_worker_name (worker_name);

-- Permit extensions indexes
ALTER TABLE permit_extensions 
  ADD INDEX idx_permit_id (permit_id),
  ADD INDEX idx_status (status),
  ADD INDEX idx_requested_at (requested_at);

-- Notifications indexes
ALTER TABLE notifications 
  ADD INDEX idx_user_id (user_id),
  ADD INDEX idx_read_status (is_read),
  ADD INDEX idx_created_at (created_at),
  ADD INDEX idx_user_read (user_id, is_read);

-- Permit hazards indexes
ALTER TABLE permit_hazards 
  ADD INDEX idx_permit_id (permit_id),
  ADD INDEX idx_hazard_id (hazard_id);

-- Permit PPE indexes
ALTER TABLE permit_ppe 
  ADD INDEX idx_permit_id (permit_id),
  ADD INDEX idx_ppe_id (ppe_id);

-- Permit checklist responses indexes
ALTER TABLE permit_checklist_responses 
  ADD INDEX idx_permit_id (permit_id),
  ADD INDEX idx_question_id (question_id);

-- ============= QUERY OPTIMIZATION =============

-- Analyze tables for query optimization
ANALYZE TABLE permits;
ANALYZE TABLE users;
ANALYZE TABLE sites;
ANALYZE TABLE permit_team_members;
ANALYZE TABLE permit_extensions;
ANALYZE TABLE notifications;
ANALYZE TABLE permit_hazards;
ANALYZE TABLE permit_ppe;
ANALYZE TABLE permit_checklist_responses;

-- ============= CLEANUP OLD DATA (Optional) =============

-- Archive old closed permits (older than 1 year)
-- Uncomment if needed:
-- CREATE TABLE permits_archive LIKE permits;
-- INSERT INTO permits_archive 
-- SELECT * FROM permits 
-- WHERE status = 'Closed' AND updated_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- ============= VERIFICATION =============

-- Show all indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS
FROM 
    INFORMATION_SCHEMA.STATISTICS
WHERE 
    TABLE_SCHEMA = 'amazon_eptw_db'
GROUP BY 
    TABLE_NAME, INDEX_NAME
ORDER BY 
    TABLE_NAME, INDEX_NAME;

SELECT 'Database optimization completed successfully!' AS Status;
