import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { ADMIN_NAV_ITEMS } from "./nav";
import { api } from "../../api";
import AssetBadges from "../../components/AssetBadges";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ date: "", department: "", personType: "" });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.date) params.set("date", filters.date);
    if (filters.department) params.set("department", filters.department);
    if (filters.personType) params.set("personType", filters.personType);
    api.get(`/admin/logs?${params.toString()}`).then((d) => setLogs(d.logs));
  }, [filters]);

  return (
    <div className="flex bg-ink-900/[0.02]">
      <Sidebar items={ADMIN_NAV_ITEMS} />
      <main className="h-screen flex-1 overflow-y-auto px-8 py-6">
        <h1 className="text-2xl font-semibold text-ink-900">Activity log</h1>
        <p className="mt-0.5 text-sm text-ink-500">Full sign-in/out history with the handling officer attached</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <input type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          <input placeholder="Filter by department…" value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          <select value={filters.personType} onChange={(e) => setFilters({ ...filters, personType: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm">
            <option value="">All types</option>
            <option value="employee">Employees</option>
            <option value="visitor">Visitors</option>
          </select>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-ink-300/60 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-900/[0.03] text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Person</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Assets</th>
                <th className="px-4 py-3 font-medium">Time in</th>
                <th className="px-4 py-3 font-medium">Time out</th>
                <th className="px-4 py-3 font-medium">Signed in by</th>
                <th className="px-4 py-3 font-medium">Signed out by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/50">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{l.person_name}</td>
                  <td className="px-4 py-3 capitalize text-ink-700">{l.visitor_type}</td>
                  <td className="px-4 py-3"><AssetBadges assets={l.assets} /></td>
                  <td className="px-4 py-3 text-ink-500">{new Date(l.time_in).toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink-500">{l.time_out ? new Date(l.time_out).toLocaleString() : "—"}</td>
                  <td className="px-4 py-3 text-ink-500">{l.signed_in_by || "Self-service kiosk"}</td>
                  <td className="px-4 py-3 text-ink-500">{l.signed_out_by || (l.time_out ? "Self-service kiosk" : "—")}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-ink-500">No records match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
