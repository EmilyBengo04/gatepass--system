const express = require("express");
const createRouter = require("../utils/router");
const pool = require("../db");
const { sendHostNotification } = require("../utils/mailer");

const router = createRouter();

// Public (kiosk): register a visitor's arrival, notify the host by email
router.post("/signin", async (req, res) => {
  const { name, phone, email, host_employee_id, purpose, assets = [] } = req.body;

  if (!name || !phone || !host_employee_id) {
    return res.status(400).json({ error: "Name, phone number, and host are required." });
  }

  const client = await pool.connect();
  let visitLogId, timeIn, host;

  try {
    const { rows: hostRows } = await client.query(
      "SELECT id, name, email, department FROM employees WHERE id = $1 AND active = TRUE",
      [host_employee_id]
    );
    host = hostRows[0];
    if (!host) {
      client.release();
      return res.status(404).json({ error: "Selected host could not be found." });
    }

    await client.query("BEGIN");
    const { rows: visitRows } = await client.query(
      `INSERT INTO visit_logs (visitor_type, visitor_name, visitor_phone, visitor_email, host_employee_id, purpose, time_in)
       VALUES ('visitor', $1, $2, $3, $4, $5, now())
       RETURNING id, time_in`,
      [name, phone, email || null, host_employee_id, purpose || null]
    );
    visitLogId = visitRows[0].id;
    timeIn = visitRows[0].time_in;

    for (const asset of assets) {
      if (!asset.identifier) continue;
      await client.query(
        `INSERT INTO assets (visit_log_id, category, ownership, identifier, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [visitLogId, asset.category, asset.ownership || "personal", asset.identifier, asset.description || null]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Visitor sign-in failed before commit:", err);
    client.release();
    return res.status(500).json({ error: "Could not complete visitor sign-in. Please try again." });
  }
  client.release();

  // The sign-in itself is already saved at this point — everything below is
  // best-effort. If notifying the host fails (bad SMTP config, a slow DNS
  // lookup, whatever), the visitor should still see a success message
  // rather than a false error telling them to retry (which previously could
  // even create a duplicate sign-in if they retried after a real success).
  let notifyStatus = "skipped";
  if (host.email) {
    try {
      const result = await sendHostNotification({
        to: host.email,
        hostName: host.name,
        visitorName: name,
        purpose,
        arrivedAt: timeIn,
      });
      notifyStatus = result.status;
      await pool.query(
        `INSERT INTO notifications (visit_log_id, channel, recipient, status, error, sent_at)
         VALUES ($1, 'email', $2, $3, $4, CASE WHEN $3 = 'sent' THEN now() ELSE NULL END)`,
        [visitLogId, host.email, result.status, result.error || null]
      );
    } catch (err) {
      console.error("Host notification failed (visitor is still signed in fine):", err);
      notifyStatus = "failed";
    }
  }

  res.status(201).json({ visitLogId, timeIn, host: { name: host.name, department: host.department }, notifyStatus });
});

module.exports = router;
