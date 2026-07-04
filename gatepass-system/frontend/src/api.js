// In local dev, VITE_API_URL is left unset and requests go to the relative
// "/api" path, which Vite's dev server proxies to the backend (see
// vite.config.js). In production, where the frontend and backend are often
// deployed as separate services on different domains, set VITE_API_URL to
// the backend's full URL (e.g. https://gatepass-backend.onrender.com).
const BASE = `${import.meta.env.VITE_API_URL || ""}/api`;

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
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
    const res = await fetch(`${BASE}${path}`, { credentials: "include" });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res.blob();
  },
};