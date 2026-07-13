// In local dev, VITE_API_URL is left unset and requests go to the relative
// "/api" path, which Vite's dev server proxies to the backend (see
// vite.config.js). In production, where the frontend and backend are often
// deployed as separate services on different domains, set VITE_API_URL to
// the backend's full URL (e.g. https://gatepass-backend.onrender.com).
const BASE = `${import.meta.env.VITE_API_URL || ""}/api`;

const TOKEN_KEY = "gatepass_token";

// Auth is sent as an Authorization header (backed by localStorage) rather
// than relying only on the login cookie. Reason: frontend and backend are
// commonly deployed on two different domains, which makes the session
// cookie a "third-party cookie" from the browser's point of view — and
// Safari and Firefox block third-party cookies by default (Chrome mostly
// doesn't, yet, but is inconsistent). A header sent explicitly by our own
// JS isn't subject to any of that blocking, so this works the same in
// every browser regardless of cookie policy.
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include", // harmless to keep; still works for same-domain deployments
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  async getBlob(path) {
    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const res = await fetch(`${BASE}${path}`, { credentials: "include", headers });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.blob();
  },
};

// For plain <img src="..."> tags, which don't go through fetch() at all and
// so need the full absolute URL spelled out directly in the markup.
export function apiUrl(path) {
  return `${BASE}${path}`;
}
