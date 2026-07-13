// Caches employee data locally so the kiosk can still function when offline:
// - a single employee record, keyed by code (for the employee sign-in lookup)
// - the full active-employee directory (for the visitor sign-in host dropdown)
//
// This is deliberately just "last known good data" — it goes stale the
// moment someone's details change and the kiosk is offline, which is an
// acceptable tradeoff for keeping the gate operational during an outage.

const EMPLOYEE_PREFIX = "gatepass_employee_cache:";
const DIRECTORY_KEY = "gatepass_employee_directory_cache";

export function cacheEmployee(code, employee) {
  try {
    localStorage.setItem(EMPLOYEE_PREFIX + code, JSON.stringify(employee));
  } catch {
    // localStorage full or unavailable — offline fallback just won't work this time
  }
}

export function getCachedEmployee(code) {
  try {
    const raw = localStorage.getItem(EMPLOYEE_PREFIX + code);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function cacheEmployeeDirectory(employees) {
  try {
    localStorage.setItem(DIRECTORY_KEY, JSON.stringify(employees));
  } catch {
    // ignore
  }
}

export function getCachedEmployeeDirectory() {
  try {
    const raw = localStorage.getItem(DIRECTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
