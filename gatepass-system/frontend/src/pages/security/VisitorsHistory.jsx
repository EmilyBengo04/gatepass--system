import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { NAV_ITEMS } from "./nav";
import { api } from "../../api";
import AssetBadges from "../../components/AssetBadges";

export default function VisitorsHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get("/visits/history?type=visitor").then((d) => setHistory(d.history));
  }, []);

  return (
    <div className="flex bg-ink-900/[0.02]">
      <Sidebar items={NAV_ITEMS} />
      <main className="h-screen flex-1 overflow-y-auto px-8 py-6">
        <h1 className="text-2xl font-semibold text-ink-900">Visitors</h1>
        <p className="mt-0.5 text-sm text-ink-500">Recent visitor sign-ins, most recent first</p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-ink-300/60 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-900/[0.03] text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Visiting</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
                <th className="px-4 py-3 font-medium">Assets</th>
                <th className="px-4 py-3 font-medium">Time in</th>
                <th className="px-4 py-3 font-medium">Time out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/50">
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{h.person_name}</td>
                  <td className="px-4 py-3 text-ink-700">{h.host_name}</td>
                  <td className="px-4 py-3 text-ink-700">{h.purpose || "—"}</td>
                  <td className="px-4 py-3"><AssetBadges assets={h.assets} /></td>
                  <td className="px-4 py-3 text-ink-500">{new Date(h.time_in).toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink-500">{h.time_out ? new Date(h.time_out).toLocaleString() : "Still in"}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-ink-500">No visitor records yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
