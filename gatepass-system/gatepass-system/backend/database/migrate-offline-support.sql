-- One-off migration for databases that were created before offline sign-in
-- support was added. Safe to run multiple times (IF NOT EXISTS guards it).
--
-- Run with: npm run migrate:offline   (from the backend/ folder)

ALTER TABLE visit_logs ADD COLUMN IF NOT EXISTS client_ref UUID UNIQUE;
