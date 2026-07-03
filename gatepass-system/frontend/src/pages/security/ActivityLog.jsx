import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { NAV_ITEMS } from "./nav";
import { api } from "../../api";

export default function ActivityLog() {
  const [history, setHistory] = useState([]);
  const [date, setDate] = useState("");

  useEffect(() => {
    const query = date ? `?date=${date}` : "";
    api.get(`/visits/history${query}`).then((d) => setHistory(d.history));
  }, [date]);

  return (
    <div className="flex bg-ink-900/[0.02]">
      <Sidebar items={NAV_ITEMS} />
      <main className="h-screen flex-1 overflow-y-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">Activity log</h1>
            <p className="mt-0.5 text-sm text-ink-500">Every gatepass event, most recent first</p>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-ink-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-ink-300/60 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-900/[0.03] text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Time in</th>
                <th className="px-4 py-3 font-medium">Time out</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/50">
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{h.person_name}</td>
                  <td className="px-4 py-3 capitalize text-ink-700">{h.visitor_type}</td>
                  <td className="px-4 py-3 text-ink-500">{new Date(h.time_in).toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink-500">{h.time_out ? new Date(h.time_out).toLocaleString() : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${h.time_out ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
                      {h.time_out ? "Signed out" : "Signed in"}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-500">No activity for this date.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
