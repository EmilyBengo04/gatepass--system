const express = require("express");
const createRouter = require("../utils/router");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = createRouter();

// Public: list of active employees, used to populate the "host" dropdown
// on the visitor form and for quick lookups. No sensitive data returned.
router.get("/", async (req, res) => {
  const { search, includeInactive } = req.query;
  const { rows } = await pool.query(
    `SELECT id, employee_code, name, department, designation, active
     FROM employees
     WHERE ($2::text = 'true' OR active = TRUE)
       AND ($1::text IS NULL OR name ILIKE '%' || $1 || '%' OR department ILIKE '%' || $1 || '%')
     ORDER BY name ASC
     LIMIT 200`,
    [search || null, includeInactive || null]
  );
  res.json({ employees: rows });
});

// Public: look up one employee by their badge/employee code (used at the gate kiosk)
router.get("/:code", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, employee_code, name, department, designation, email
     FROM employees WHERE employee_code = $1 AND active = TRUE`,
    [req.params.code.trim()]
  );
  if (!rows[0]) return res.status(404).json({ error: "No employee found with that ID." });

  const { rows: openVisit } = await pool.query(
    `SELECT id, time_in FROM visit_logs
     WHERE employee_id = $1 AND time_out IS NULL
     ORDER BY time_in DESC LIMIT 1`,
    [rows[0].id]
  );

  let assets = [];
  if (openVisit[0]) {
    const { rows: assetRows } = await pool.query(
      `SELECT id, category, ownership, identifier FROM assets WHERE visit_log_id = $1`,
      [openVisit[0].id]
    );
    assets = assetRows;
  }

  res.json({
    employee: rows[0],
    openVisit: openVisit[0] ? { ...openVisit[0], assets } : null,
  });
});

// Public (kiosk): sign an employee in, with declared assets
router.post("/:code/signin", async (req, res) => {
  const { assets = [], client_ref } = req.body;
  const client = await pool.connect();
  try {
    // If this exact submission was already processed (e.g. the kiosk queued
    // it offline, sent it, got no response due to a dropped connection, and
    // is now retrying), return the existing record instead of erroring or
    // creating a duplicate visit.
    if (client_ref) {
      const { rows: existing } = await client.query(
        "SELECT id, time_in FROM visit_logs WHERE client_ref = $1", [client_ref]
      );
      if (existing[0]) {
        return res.status(200).json({ visitLogId: existing[0].id, timeIn: existing[0].time_in, alreadyProcessed: true });
      }
    }

    const { rows: empRows } = await client.query(
      "SELECT id FROM employees WHERE employee_code = $1 AND active = TRUE",
      [req.params.code.trim()]
    );
    if (!empRows[0]) return res.status(404).json({ error: "No employee found with that ID." });
    const employeeId = empRows[0].id;

    const { rows: openVisit } = await client.query(
      "SELECT id FROM visit_logs WHERE employee_id = $1 AND time_out IS NULL",
      [employeeId]
    );
    if (openVisit[0]) {
      return res.status(409).json({ error: "This employee is already signed in.", visitLogId: openVisit[0].id });
    }

    await client.query("BEGIN");
    const { rows: visitRows } = await client.query(
      `INSERT INTO visit_logs (visitor_type, employee_id, time_in, client_ref)
       VALUES ('employee', $1, now(), $2) RETURNING id, time_in`,
      [employeeId, client_ref || null]
    );
    const visitLogId = visitRows[0].id;

    for (const asset of assets) {
      if (!asset.identifier) continue;
      await client.query(
        `INSERT INTO assets (visit_log_id, category, ownership, identifier, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [visitLogId, asset.category, asset.ownership, asset.identifier, asset.description || null]
      );
    }
    await client.query("COMMIT");
    res.status(201).json({ visitLogId, timeIn: visitRows[0].time_in });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Could not complete sign-in. Please try again." });
  } finally {
    client.release();
  }
});

// Public (kiosk): self-service checkout by scanning the same QR again.
// Security can also do this from the dashboard via /api/visits/:id/checkout.
router.post("/:code/checkout", async (req, res) => {
  // Deliberately destructured without a default: omitting this key entirely
  // (as the offline queue does, since it has no asset data to offer) means
  // "we don't know" — leave assets as-is. Sending an actual array (even an
  // empty one) means "the person reviewed this list" — a real signal, so
  // anything not in it gets flagged as a mismatch.
  const { confirmedAssetIds } = req.body;
  const client = await pool.connect();
  try {
    const { rows: empRows } = await client.query(
      "SELECT id FROM employees WHERE employee_code = $1", [req.params.code.trim()]
    );
    if (!empRows[0]) {
      client.release();
      return res.status(404).json({ error: "No employee found with that ID." });
    }

    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE visit_logs SET time_out = now()
       WHERE employee_id = $1 AND time_out IS NULL
       RETURNING id, time_out`,
      [empRows[0].id]
    );
    if (!rows[0]) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ error: "No active sign-in found for this employee." });
    }

    const visitLogId = rows[0].id;
    if (Array.isArray(confirmedAssetIds)) {
      await client.query(
        `UPDATE assets SET returned_confirmed = TRUE, mismatch = FALSE
         WHERE visit_log_id = $1 AND id = ANY($2::uuid[])`,
        [visitLogId, confirmedAssetIds]
      );
      await client.query(
        `UPDATE assets SET mismatch = TRUE
         WHERE visit_log_id = $1 AND NOT (id = ANY($2::uuid[]))`,
        [visitLogId, confirmedAssetIds]
      );
    }

    await client.query("COMMIT");
    res.json({ visitLogId, timeOut: rows[0].time_out });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    res.status(500).json({ error: "Could not complete checkout. Please try again." });
  } finally {
    client.release();
  }
});

// Admin: manage employee master list
router.post("/", requireAuth("admin"), async (req, res) => {
  const { employee_code, name, department, designation, email, phone } = req.body;
  if (!employee_code || !name || !department) {
    return res.status(400).json({ error: "Employee code, name, and department are required." });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO employees (employee_code, name, department, designation, email, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [employee_code, name, department, designation || null, email || null, phone || null]
    );
    res.status(201).json({ employee: rows[0] });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "That employee code already exists." });
    console.error(err);
    res.status(500).json({ error: "Could not create employee." });
  }
});

router.put("/:id", requireAuth("admin"), async (req, res) => {
  const { name, department, designation, email, phone, active } = req.body;
  const { rows } = await pool.query(
    `UPDATE employees SET
       name = COALESCE($2, name),
       department = COALESCE($3, department),
       designation = COALESCE($4, designation),
       email = COALESCE($5, email),
       phone = COALESCE($6, phone),
       active = COALESCE($7, active)
     WHERE id = $1 RETURNING *`,
    [req.params.id, name, department, designation, email, phone, active]
  );
  if (!rows[0]) return res.status(404).json({ error: "Employee not found." });
  res.json({ employee: rows[0] });
});

module.exports = router;
