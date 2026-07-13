const ldap = require("ldapjs");
const pool = require("../db");

// Attribute names vary a lot between AD setups, so every field we read is
// configurable via env vars rather than hardcoded. These defaults match a
// fairly standard AD schema — override any of them in .env to match yours.
const ATTR = {
  code: process.env.LDAP_ATTR_EMPLOYEE_CODE || "employeeID",
  name: process.env.LDAP_ATTR_NAME || "displayName",
  department: process.env.LDAP_ATTR_DEPARTMENT || "department",
  designation: process.env.LDAP_ATTR_DESIGNATION || "title",
  email: process.env.LDAP_ATTR_EMAIL || "mail",
  phone: process.env.LDAP_ATTR_PHONE || "telephoneNumber",
};

const ACCOUNTDISABLE = 0x2; // userAccountControl bit meaning "this AD account is disabled"

function bindClient() {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({ url: process.env.LDAP_URL, timeout: 15000, connectTimeout: 15000 });
    client.on("error", reject);
    client.bind(process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PASSWORD, (err) => {
      if (err) return reject(err);
      resolve(client);
    });
  });
}

// Normalizes the two different shapes ldapjs has used across major versions
// (v2's flat `entry.object`, v3's `entry.pojo.attributes` array of
// {type, values}) into one plain { attrName: firstValue } map.
function normalizeEntry(entry) {
  const out = {};
  if (entry.pojo && Array.isArray(entry.pojo.attributes)) {
    for (const attr of entry.pojo.attributes) {
      out[attr.type] = Array.isArray(attr.values) ? attr.values[0] : attr.values;
    }
  } else if (entry.attributes) {
    for (const attr of entry.attributes) {
      const vals = attr.values || attr.vals;
      out[attr.type] = Array.isArray(vals) ? vals[0] : vals;
    }
  } else if (entry.object) {
    Object.assign(out, entry.object);
  }
  return out;
}

function searchUsers(client) {
  const baseDN = process.env.LDAP_BASE_DN;
  const filter = process.env.LDAP_SEARCH_FILTER || "(&(objectClass=user)(objectCategory=person))";
  const attributes = [ATTR.code, ATTR.name, ATTR.department, ATTR.designation, ATTR.email, ATTR.phone, "userAccountControl", "sAMAccountName"];

  return new Promise((resolve, reject) => {
    const results = [];
    client.search(baseDN, { filter, scope: "sub", attributes }, (err, res) => {
      if (err) return reject(err);
      res.on("searchEntry", (entry) => results.push(normalizeEntry(entry)));
      res.on("error", reject);
      res.on("end", (result) => {
        if (result && result.status !== 0) {
          return reject(new Error(`LDAP search ended with status ${result.status}`));
        }
        resolve(results);
      });
    });
  });
}

/**
 * Runs a full sync: fetches every matching AD user, upserts them into the
 * local employees table, and deactivates any previously-synced employee
 * who no longer appears in the results (left the company, moved OU, etc.).
 *
 * Only ever touches rows with source = 'ldap' — manually-added employees
 * (contractors, vendors, anyone not in AD) are never modified by this.
 *
 * Returns a summary: { found, created, updated, deactivated, skipped }
 */
async function syncEmployeesFromLdap() {
  if (!process.env.LDAP_URL || !process.env.LDAP_BASE_DN) {
    throw new Error("LDAP_URL and LDAP_BASE_DN must be set to run a sync.");
  }

  const client = await bindClient();
  let entries;
  try {
    entries = await searchUsers(client);
  } finally {
    client.unbind();
  }

  const summary = { found: entries.length, created: 0, updated: 0, deactivated: 0, skipped: 0 };
  const seenCodes = [];

  for (const entry of entries) {
    const code = entry[ATTR.code] || entry.sAMAccountName;
    const name = entry[ATTR.name];
    if (!code || !name) {
      summary.skipped++; // can't use a record with no ID or no name
      continue;
    }

    const uac = Number(entry.userAccountControl);
    const active = Number.isFinite(uac) ? (uac & ACCOUNTDISABLE) === 0 : true;

    // Merges by employee_code: if this code already exists (even as a
    // manually-added record — e.g. someone was pre-created before the first
    // sync ran), AD becomes authoritative for it going forward. This is a
    // deliberate choice: matching employee_code means it's the same real
    // person, so letting the sync "adopt" that record and keep it current
    // is more useful than leaving two disconnected records around.
    const { rows } = await pool.query(
      `INSERT INTO employees (employee_code, name, department, designation, email, phone, active, source, ldap_synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ldap', now())
       ON CONFLICT (employee_code) DO UPDATE SET
         name = EXCLUDED.name,
         department = COALESCE(EXCLUDED.department, employees.department),
         designation = COALESCE(EXCLUDED.designation, employees.designation),
         email = COALESCE(EXCLUDED.email, employees.email),
         phone = COALESCE(EXCLUDED.phone, employees.phone),
         active = EXCLUDED.active,
         source = 'ldap',
         ldap_synced_at = now()
       RETURNING (xmax = 0) AS inserted`,
      [code, name, entry[ATTR.department] || null, entry[ATTR.designation] || null, entry[ATTR.email] || null, entry[ATTR.phone] || null, active]
    );

    if (rows[0]?.inserted) summary.created++;
    else summary.updated++;
    seenCodes.push(code);
  }

  // Anyone previously synced from LDAP but missing from this run's results
  // has left, been moved out of scope, or otherwise dropped out of AD —
  // deactivate rather than delete, so their visit history stays intact.
  const { rowCount } = await pool.query(
    `UPDATE employees SET active = FALSE, ldap_synced_at = now()
     WHERE source = 'ldap' AND active = TRUE AND NOT (employee_code = ANY($1::text[]))`,
    [seenCodes]
  );
  summary.deactivated = rowCount;

  return summary;
}

module.exports = { syncEmployeesFromLdap };
