import { useEffect, useState } from "react";
import { queueLength } from "../offlineQueue";

export default function OfflineBanner() {
  const [pending, setPending] = useState(queueLength());
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updatePending = () => setPending(queueLength());
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("gatepass-queue-changed", updatePending);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("gatepass-queue-changed", updatePending);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online && pending === 0) return null;

  return (
    <div
      className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
        online ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-700"
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${online ? "bg-amber-500" : "bg-red-500"}`} />
      {online
        ? `Back online — syncing ${pending} pending sign-in${pending === 1 ? "" : "s"}…`
        : pending > 0
        ? `No connection — ${pending} sign-in${pending === 1 ? "" : "s"} saved and waiting to sync.`
        : "No connection — sign-ins will be saved locally and synced automatically."}
    </div>
  );
}
