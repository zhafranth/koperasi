-- Alter users table: replace email with username and add optional photo
ALTER TABLE users DROP COLUMN IF EXISTS email;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo TEXT NULL;
DROP INDEX IF EXISTS idx_users_email;
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

