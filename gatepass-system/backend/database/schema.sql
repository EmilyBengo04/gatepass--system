-- Gatepass System database schema (PostgreSQL)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Security / admin user accounts
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('security', 'admin')),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Employee master data
CREATE TABLE IF NOT EXISTS employees (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code  VARCHAR(30) UNIQUE NOT NULL,
  name           VARCHAR(120) NOT NULL,
  department     VARCHAR(80) NOT NULL,
  designation    VARCHAR(80),
  email          VARCHAR(160),
  phone          VARCHAR(30),
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per sign-in event, for both employees and visitors
CREATE TABLE IF NOT EXISTS visit_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_type      VARCHAR(10) NOT NULL CHECK (visitor_type IN ('employee', 'visitor')),
  employee_id       UUID REFERENCES employees(id),
  visitor_name      VARCHAR(120),
  visitor_phone     VARCHAR(30),
  visitor_email     VARCHAR(160),
  host_employee_id  UUID REFERENCES employees(id),
  purpose           VARCHAR(200),
  time_in           TIMESTAMPTZ NOT NULL DEFAULT now(),
  time_out          TIMESTAMPTZ,
  signed_in_by       UUID REFERENCES users(id),
  signed_out_by      UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT employee_requires_employee_id
    CHECK (visitor_type <> 'employee' OR employee_id IS NOT NULL),
  CONSTRAINT visitor_requires_name
    CHECK (visitor_type <> 'visitor' OR visitor_name IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_visit_logs_open ON visit_logs (time_out) WHERE time_out IS NULL;
CREATE INDEX IF NOT EXISTS idx_visit_logs_time_in ON visit_logs (time_in);
CREATE INDEX IF NOT EXISTS idx_visit_logs_employee ON visit_logs (employee_id);
CREATE INDEX IF NOT EXISTS idx_visit_logs_host ON visit_logs (host_employee_id);

-- Assets declared for a visit (vehicle, laptop, other gadgets)
CREATE TABLE IF NOT EXISTS assets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_log_id        UUID NOT NULL REFERENCES visit_logs(id) ON DELETE CASCADE,
  category            VARCHAR(20) NOT NULL CHECK (category IN ('vehicle', 'laptop', 'other')),
  ownership           VARCHAR(10) NOT NULL CHECK (ownership IN ('personal', 'company')),
  identifier          VARCHAR(80) NOT NULL, -- plate number / serial number / description
  description         VARCHAR(120),
  returned_confirmed  BOOLEAN NOT NULL DEFAULT FALSE,
  mismatch            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_visit ON assets (visit_log_id);

-- Record of host notifications sent for visitor sign-ins
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_log_id  UUID NOT NULL REFERENCES visit_logs(id) ON DELETE CASCADE,
  channel       VARCHAR(20) NOT NULL DEFAULT 'email',
  recipient     VARCHAR(160) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | sent | failed
  error         TEXT,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_visit ON notifications (visit_log_id);
