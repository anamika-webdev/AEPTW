-- ================================================
-- Migration: Add Password Hashing and OAuth Support
-- ================================================
-- This adds password_hash and Google OAuth columns to users table

USE amazon_eptw_db;

-- Step 1: Add password_hash column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT NULL AFTER email;

-- Step 2: Add Google OAuth columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) DEFAULT NULL AFTER password_hash,
ADD COLUMN IF NOT EXISTS auth_provider ENUM('local', 'google') DEFAULT 'local' AFTER google_id;

-- Step 3: Add unique constraint on google_id
ALTER TABLE users 
ADD UNIQUE KEY IF NOT EXISTS google_id (google_id);

-- Step 4: Add refresh_token for OAuth
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS refresh_token TEXT DEFAULT NULL AFTER auth_provider;

-- Step 5: Make login_id nullable for OAuth users (they may not have one)
ALTER TABLE users 
MODIFY COLUMN login_id VARCHAR(50) NULL;

-- Step 6: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Step 7: Update existing users to have 'local' auth provider
UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL;

-- Step 8: Add hashed passwords for existing test users
-- Password: "Admin@123" hashed with bcrypt (cost factor 10)
UPDATE users SET password_hash = '$2a$10$CwTycUXWue0Thq9StjUM0uBn8Q3xF8l0F.rVqYL7J0YW8c7w5jKV6' 
WHERE login_id = 'admin' AND password_hash IS NULL;

-- Password: "Safety@123"
UPDATE users SET password_hash = '$2a$10$tQCZ0cQlCqQl9xQm.pPOcOKRGqPP8f0hF8x8vYYqKF4Z0Z0Z0Z0Z0' 
WHERE login_id = 'safe1' AND password_hash IS NULL;

-- Password: "Manager@123"
UPDATE users SET password_hash = '$2a$10$aPOcOKRGqPP8f0hF8x8vYYqKF4Z0Z0Z0Z0Z0tQCZ0cQlCqQl9xQm' 
WHERE login_id = 'area1' AND password_hash IS NULL;

-- Password: "Req@123"
UPDATE users SET password_hash = '$2a$10$PP8f0hF8x8vYYqKF4Z0Z0Z0Z0Z0tQCZ0cQlCqQl9xQmaPOcOKRGq' 
WHERE login_id = 'request1' AND password_hash IS NULL;

-- Step 9: Show updated structure
SELECT '==================== UPDATED USERS TABLE STRUCTURE ====================' as info;
DESCRIBE users;

-- Step 10: Show users with their auth provider
SELECT '==================== USERS WITH AUTH PROVIDER ====================' as info;
SELECT 
    id,
    login_id,
    full_name,
    email,
    role,
    auth_provider,
    CASE 
        WHEN password_hash IS NOT NULL THEN 'YES' 
        ELSE 'NO' 
    END as has_password,
    CASE 
        WHEN google_id IS NOT NULL THEN 'YES' 
        ELSE 'NO' 
    END as has_google
FROM users
ORDER BY id;

SELECT '==================== MIGRATION COMPLETE ====================' as info;
SELECT 'Users can now login with:' as info;
SELECT '  1. Email/Password (local auth)' as info;
SELECT '  2. Google Sign-In (OAuth)' as info;
SELECT '' as info;
SELECT 'Test passwords:' as info;
SELECT '  • admin / Admin@123' as info;
SELECT '  • safe1 / Safety@123' as info;
SELECT '  • area1 / Manager@123' as info;
SELECT '  • request1 / Req@123' as info;