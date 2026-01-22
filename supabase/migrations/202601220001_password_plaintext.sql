-- WARNING: Menyimpan password plaintext tidak aman. Ikuti permintaan pengguna.
-- Tambah kolom password dan hapus kolom password_hash jika ada.
DO $$ 
BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '' NOT NULL;
EXCEPTION WHEN duplicate_column THEN
  NULL;
END $$;

UPDATE users SET password = COALESCE(password, '');

ALTER TABLE users ALTER COLUMN password DROP DEFAULT;

ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Pastikan phone unik
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_phone_unique UNIQUE (phone);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
