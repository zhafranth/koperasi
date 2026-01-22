-- Ensure users has photo_url instead of photo
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT NULL;
UPDATE users SET photo_url = photo WHERE photo_url IS NULL AND photo IS NOT NULL;
ALTER TABLE users DROP COLUMN IF EXISTS photo;

