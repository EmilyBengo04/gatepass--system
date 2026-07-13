import { api } from "./api";

const QUEUE_KEY = "gatepass_offline_queue";

// fetch() rejects with a TypeError specifically when the request never
// reached a server at all (offline, DNS failure, connection refused) — in
// every browser. If we got any HTTP response, even an error one, api.js's
// request() throws a plain Error instead. This lets us tell "the network is
// genuinely down, queue it" apart from "the server said no, show that".
export function isNetworkError(err) {
  return err instanceof TypeError;
}

function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeQueue(items) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("gatepass-queue-changed"));
}

export function getQueue() {
  return readQueue();
}

export function queueLength() {
  return readQueue().length;
}

// kind: "employee-signin" | "employee-checkout" | "visitor-signin"
export function enqueue(kind, payload) {
  const items = readQueue();
  const item = {
    id: crypto.randomUUID(),
    kind,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  items.push(item);
  writeQueue(items);
  return item;
}

function removeItem(id) {
  writeQueue(readQueue().filter((i) => i.id !== id));
}

async function sendItem(item) {
  switch (item.kind) {
    case "employee-signin":
      return api.post(`/employees/${encodeURIComponent(item.payload.code)}/signin`, {
        assets: item.payload.assets,
        client_ref: item.id,
      });
    case "employee-checkout":
      return api.post(`/employees/${encodeURIComponent(item.payload.code)}/checkout`, {});
    case "visitor-signin":
      return api.post("/visitors/signin", { ...item.payload, client_ref: item.id });
    default:
      throw new Error(`Unknown queued action: ${item.kind}`);
  }
}

let flushing = false;

// Attempts every queued item once. Definitive outcomes (success, or a
// business error meaning the action no longer applies — e.g. "already
// signed in") remove the item. A genuine network failure stops the pass
// immediately, since if one item can't reach the server, none of the rest
// will either — they'll get picked up on the next flush.
export async function flushQueue() {
  if (flushing) return;
  flushing = true;
  try {
    const items = readQueue();
    for (const item of items) {
      try {
        await sendItem(item);
        removeItem(item.id);
      } catch (err) {
        if (isNetworkError(err)) {
          break; // still offline — stop here, try the rest next time
        }
        // A real response came back (400/404/409/500). For sign-ins this
        // almost always means "already processed" (see alreadyProcessed /
        // 409 handling server-side) — safe to drop rather than retry
        // forever. For checkout, a 404 means there was nothing open to
        // close, which is also a safe no-op to drop.
        console.warn("Dropping queued action after server rejection:", item, err.message);
        removeItem(item.id);
      }
    }
  } finally {
    flushing = false;
  }
}

// Call once from the app root: retries on reconnect, and periodically in
// case the 'online' event doesn't fire reliably (some browsers/OSes are
// inconsistent about it, especially on captive portals or flaky wifi).
export function startOfflineSync() {
  flushQueue();
  window.addEventListener("online", flushQueue);
  const interval = setInterval(flushQueue, 20000);
  return () => {
    window.removeEventListener("online", flushQueue);
    clearInterval(interval);
  };
}
