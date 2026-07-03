const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export function apiUrl(path) {
  return `${BASE}${path}`;
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(apiUrl(path), {
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

async function requestBlob(path) {
  const res = await fetch(apiUrl(path), {
    credentials: "include",
  });

  if (!res.ok) {
    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json() : null;
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  return res.blob();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  getBlob: (path) => requestBlob(path),
};
