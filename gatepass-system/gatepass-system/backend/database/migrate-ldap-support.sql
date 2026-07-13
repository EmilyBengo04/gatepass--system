-- One-off migration for databases that were created before LDAP sync
-- support was added. Safe to run multiple times.
--
-- Run with: npm run migrate:ldap   (from the backend/ folder)

ALTER TABLE employees ADD COLUMN IF NOT EXISTS source VARCHAR(10) NOT NULL DEFAULT 'manual';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ldap_synced_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employees_source_check'
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_source_check CHECK (source IN ('manual', 'ldap'));
  END IF;
END $$;
