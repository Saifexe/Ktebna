-- One-off data migration (2026-09-22): uploads used to be stored as absolute
-- links built from APP_BASE_URL (e.g. http://localhost:8080/uploads/x.jpg),
-- which broke every image when the host changed. The backend now stores
-- relative /uploads/x.jpg paths; this rewrites the rows saved before that.
--
-- Idempotent: rows that are already relative, empty, or point at another site
-- are left alone. Run it once per database (Docker MySQL and local XAMPP):
--   docker exec -i ktebna-mysql mysql -uktebna_user -p ktebna < scripts/migrate-relative-upload-urls.sql

UPDATE posts
SET book_image = SUBSTRING(book_image, LOCATE('/uploads/', book_image))
WHERE book_image REGEXP '^https?://[^/]+/uploads/';

UPDATE users
SET profile_picture = SUBSTRING(profile_picture, LOCATE('/uploads/', profile_picture))
WHERE profile_picture REGEXP '^https?://[^/]+/uploads/';
