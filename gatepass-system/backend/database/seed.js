// Seeds demo data: one admin account, one security account, and a handful
// of employees so the app is immediately usable after setup.
//
// Run with: npm run seed   (from the backend/ folder)

require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../src/db");

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const adminPass = await bcrypt.hash("Admin@123", 10);
    const securityPass = await bcrypt.hash("Security@123", 10);

    await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      ["System Administrator", "admin@gatepass.local", adminPass]
    );

    await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'security')
       ON CONFLICT (email) DO NOTHING`,
      ["Jane Security", "security@gatepass.local", securityPass]
    );

    const employees = [
      ["EMP001", "Sarah Johnson", "Engineering", "Software Engineer", "sarah.johnson@company.com", "0700111222"],
      ["EMP002", "Michael Chen", "Acme Corp", "Contractor", "michael.chen@acme.com", "0700111223"],
      ["EMP003", "David Park", "Marketing", "Marketing Lead", "david.park@company.com", "0700111224"],
      ["EMP004", "Emily Rodriguez", "HR", "HR Manager", "emily.rodriguez@company.com", "0700111225"],
      ["EMP005", "James Wilson", "Stark Industries", "Consultant", "james.wilson@stark.com", "0700111226"],
    ];

    for (const [code, name, department, designation, email, phone] of employees) {
      await client.query(
        `INSERT INTO employees (employee_code, name, department, designation, email, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (employee_code) DO NOTHING`,
        [code, name, department, designation, email, phone]
      );
    }

    await client.query("COMMIT");
    console.log("Seed complete.");
    console.log("  Admin login:    admin@gatepass.local / Admin@123");
    console.log("  Security login: security@gatepass.local / Security@123");
    console.log("  Sample employee codes: EMP001 .. EMP005");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
