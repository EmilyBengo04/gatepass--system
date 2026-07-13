const express = require("express");
const createRouter = require("../utils/router");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = createRouter();

// Shared select fragment: one row per visit, joined with employee/host names
// and aggregated assets. Used by /active and /recent.
const VISIT_SELECT = `
  SELECT
    vl.id,
    vl.visitor_type,
    vl.time_in,
    vl.time_out,
    COALESCE(e.name, vl.visitor_name) AS person_name,
    COALESCE(e.department, host.department) AS department,
    e.employee_code,
    host.name AS host_name,
    vl.purpose,
    COALESCE(
      json_agg(
        json_build_object(
          'id', a.id, 'category', a.category, 'ownership', a.ownership,
          'identifier', a.identifier, 'returnedConfirmed', a.returned_confirmed, 'mismatch', a.mismatch
        )
      ) FILTER (WHERE a.id IS NOT NULL), '[]'
    ) AS assets
  FROM visit_logs vl
  LEFT JOIN employees e ON e.id = vl.employee_id
  LEFT JOIN employees host ON host.id = vl.host_employee_id
  LEFT JOIN assets a ON a.visit_log_id = vl.id
`;

router.get("/active", requireAuth("security", "admin"), async (req, res) => {
  const { rows } = await pool.query(
    `${VISIT_SELECT} WHERE vl.time_out IS NULL
     GROUP BY vl.id, e.name, e.department, e.employee_code, host.name, host.department
     ORDER BY vl.time_in DESC`
  );
  res.json({ active: rows });
});

router.get("/recent", requireAuth("security", "admin"), async (req, res) => {
  const hours = Number(req.query.hours) || 1;
  const { rows } = await pool.query(
    `${VISIT_SELECT} WHERE vl.time_in >= now() - ($1 || ' hours')::interval
        OR vl.time_out >= now() - ($1 || ' hours')::interval
     GROUP BY vl.id, e.name, e.department, e.employee_code, host.name, host.department
     ORDER BY GREATEST(vl.time_in, COALESCE(vl.time_out, vl.time_in)) DESC
     LIMIT 50`,
    [hours]
  );
  res.json({ recent: rows });
});

router.get("/stats", requireAuth("security", "admin"), async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM visit_logs WHERE time_out IS NULL) AS total_in_building,
      (SELECT COUNT(*) FROM visit_logs WHERE time_out IS NULL AND visitor_type = 'employee') AS employees_present,
      (SELECT COUNT(*) FROM visit_logs WHERE time_out IS NULL AND visitor_type = 'visitor') AS visitors_on_site,
      (SELECT COUNT(*) FROM visit_logs WHERE time_out::date = CURRENT_DATE) AS signouts_today,
      (SELECT COUNT(*) FROM visit_logs WHERE time_in::date = CURRENT_DATE) AS signins_today,
      (SELECT COUNT(*) FROM employees WHERE active = TRUE) AS total_employees
  `);
  res.json({ stats: rows[0] });
});

// Security or admin: browse recent sign-in/out history (for the Activity
// Log and Visitors views). Officer attribution is left to the admin-only
// /api/admin/logs endpoint.
router.get("/history", requireAuth("security", "admin"), async (req, res) => {
  const { type, date } = req.query;
  const { rows } = await pool.query(
    `${VISIT_SELECT}
     WHERE ($1::text IS NULL OR vl.visitor_type = $1)
       AND ($2::date IS NULL OR vl.time_in::date = $2::date)
     GROUP BY vl.id, e.name, e.department, e.employee_code, host.name, host.department
     ORDER BY vl.time_in DESC
     LIMIT 200`,
    [type || null, date || null]
  );
  res.json({ history: rows });
});

// Security or admin: sign someone out, optionally confirming which declared
// assets are actually leaving with them (anything not confirmed is flagged).
router.post("/:id/checkout", requireAuth("security", "admin"), async (req, res) => {
  const { confirmedAssetIds } = req.body; // omitted = unknown, don't touch assets; array = reviewed
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE visit_logs SET time_out = now(), signed_out_by = $2
       WHERE id = $1 AND time_out IS NULL
       RETURNING id, time_out`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "No active visit found, or it was already signed out." });
    }

    if (Array.isArray(confirmedAssetIds)) {
      await client.query(
        `UPDATE assets SET returned_confirmed = TRUE, mismatch = FALSE
         WHERE visit_log_id = $1 AND id = ANY($2::uuid[])`,
        [req.params.id, confirmedAssetIds]
      );
      await client.query(
        `UPDATE assets SET mismatch = TRUE
         WHERE visit_log_id = $1 AND NOT (id = ANY($2::uuid[]))`,
        [req.params.id, confirmedAssetIds]
      );
    }

    await client.query("COMMIT");
    res.json({ visitLogId: rows[0].id, timeOut: rows[0].time_out });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Could not complete checkout." });
  } finally {
    client.release();
  }
});

module.exports = router;
