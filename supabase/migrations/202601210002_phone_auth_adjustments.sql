-- Make username optional and enforce unique phone for phone-based auth
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

