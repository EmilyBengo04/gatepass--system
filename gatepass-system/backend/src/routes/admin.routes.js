const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth("admin"));

// Full activity log, filterable by date / department / person, with the
// security officer who handled each check-in/out attached for accountability.
router.get("/logs", async (req, res) => {
  const { date, department, personType } = req.query;
  const { rows } = await pool.query(
    `SELECT
       vl.id, vl.visitor_type, vl.time_in, vl.time_out, vl.purpose,
       COALESCE(e.name, vl.visitor_name) AS person_name,
       COALESCE(e.department, host.department) AS department,
       host.name AS host_name,
       in_officer.name AS signed_in_by,
       out_officer.name AS signed_out_by
     FROM visit_logs vl
     LEFT JOIN employees e ON e.id = vl.employee_id
     LEFT JOIN employees host ON host.id = vl.host_employee_id
     LEFT JOIN users in_officer ON in_officer.id = vl.signed_in_by
     LEFT JOIN users out_officer ON out_officer.id = vl.signed_out_by
     WHERE ($1::date IS NULL OR vl.time_in::date = $1::date)
       AND ($2::text IS NULL OR COALESCE(e.department, host.department) ILIKE '%' || $2 || '%')
       AND ($3::text IS NULL OR vl.visitor_type = $3)
     ORDER BY vl.time_in DESC
     LIMIT 500`,
    [date || null, department || null, personType || null]
  );
  res.json({ logs: rows });
});

// Security-officer accountability: who was on duty and how many
// check-ins/outs they processed on a given day.
router.get("/officer-activity", async (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().slice(0, 10);
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.role,
       COUNT(DISTINCT vl_in.id) AS checkins_handled,
       COUNT(DISTINCT vl_out.id) AS checkouts_handled
     FROM users u
     LEFT JOIN visit_logs vl_in ON vl_in.signed_in_by = u.id AND vl_in.time_in::date = $1::date
     LEFT JOIN visit_logs vl_out ON vl_out.signed_out_by = u.id AND vl_out.time_out::date = $1::date
     WHERE u.role IN ('security', 'admin')
     GROUP BY u.id, u.name, u.role
     ORDER BY u.name`,
    [targetDate]
  );
  res.json({ date: targetDate, officers: rows });
});

router.get("/reports/summary", async (req, res) => {
  const { from, to } = req.query;
  const fromDate = from || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const toDate = to || new Date().toISOString().slice(0, 10);

  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE visitor_type = 'visitor') AS visitor_count,
       COUNT(*) FILTER (WHERE visitor_type = 'employee') AS employee_signins,
       ROUND(AVG(EXTRACT(EPOCH FROM (time_out - time_in)) / 60) FILTER (WHERE time_out IS NOT NULL))::int AS avg_dwell_minutes,
       (SELECT COUNT(*) FROM assets a JOIN visit_logs v ON v.id = a.visit_log_id
          WHERE a.mismatch = TRUE AND v.time_in::date BETWEEN $1::date AND $2::date) AS asset_mismatches
     FROM visit_logs
     WHERE time_in::date BETWEEN $1::date AND $2::date`,
    [fromDate, toDate]
  );
  res.json({ from: fromDate, to: toDate, summary: rows[0] });
});

// --- User (security / admin account) management ---

router.get("/users", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at DESC"
  );
  res.json({ users: rows });
});

router.post("/users", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !["security", "admin"].includes(role)) {
    return res.status(400).json({ error: "Name, email, password, and a valid role are required." });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, active, created_at`,
      [name, email.toLowerCase().trim(), hash, role]
    );
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "That email is already registered." });
    console.error(err);
    res.status(500).json({ error: "Could not create user." });
  }
});

router.put("/users/:id/active", async (req, res) => {
  const { active } = req.body;
  const { rows } = await pool.query(
    "UPDATE users SET active = $2 WHERE id = $1 RETURNING id, name, email, role, active",
    [req.params.id, Boolean(active)]
  );
  if (!rows[0]) return res.status(404).json({ error: "User not found." });
  res.json({ user: rows[0] });
});

module.exports = router;
