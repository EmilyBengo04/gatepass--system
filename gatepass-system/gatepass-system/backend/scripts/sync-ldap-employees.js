// Syncs employee records from Active Directory / LDAP into the local
// employees table. Safe to re-run — it's a full upsert + reconcile each time.
//
// Run manually with: npm run sync:ldap   (from the backend/ folder)
// For production, schedule this via cron (e.g. nightly) rather than relying
// on someone remembering to run it — see README section on LDAP sync.

require("dotenv").config();
const { syncEmployeesFromLdap } = require("../src/utils/ldapSync");
const pool = require("../src/db");

syncEmployeesFromLdap()
  .then((summary) => {
    console.log("LDAP sync complete:");
    console.log(`  Found in AD:   ${summary.found}`);
    console.log(`  Created:       ${summary.created}`);
    console.log(`  Updated:       ${summary.updated}`);
    console.log(`  Deactivated:   ${summary.deactivated} (no longer found in AD)`);
    if (summary.skipped) console.log(`  Skipped:       ${summary.skipped} (missing ID or name)`);
    return pool.end();
  })
  .catch((err) => {
    console.error("LDAP sync failed:", err.message);
    process.exitCode = 1;
  });
