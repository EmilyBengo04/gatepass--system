import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { ADMIN_NAV_ITEMS } from "./nav";
import { api } from "../../api";

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

export default function AdminReports() {
  const [range, setRange] = useState({ from: daysAgo(7), to: today() });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get(`/admin/reports/summary?from=${range.from}&to=${range.to}`).then((d) => setSummary(d.summary));
  }, [range]);

  return (
    <div className="flex bg-ink-900/[0.02]">
      <Sidebar items={ADMIN_NAV_ITEMS} />
      <main className="h-screen flex-1 overflow-y-auto px-8 py-6">
        <h1 className="text-2xl font-semibold text-ink-900">Reports</h1>
        <p className="mt-0.5 text-sm text-ink-500">Summary of gate activity over a chosen period</p>

        <div className="mt-4 flex items-center gap-3">
          <label className="text-sm text-ink-500">From</label>
          <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          <label className="text-sm text-ink-500">To</label>
          <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm" />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-ink-300/60 bg-white p-5 shadow-card">
            <p className="text-sm text-ink-500">Visitors</p>
            <p className="mt-2 text-3xl font-semibold text-ink-900">{summary?.visitor_count ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-ink-300/60 bg-white p-5 shadow-card">
            <p className="text-sm text-ink-500">Employee sign-ins</p>
            <p className="mt-2 text-3xl font-semibold text-ink-900">{summary?.employee_signins ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-ink-300/60 bg-white p-5 shadow-card">
            <p className="text-sm text-ink-500">Avg. dwell time</p>
            <p className="mt-2 text-3xl font-semibold text-ink-900">{summary?.avg_dwell_minutes ? `${summary.avg_dwell_minutes}m` : "—"}</p>
          </div>
          <div className="rounded-2xl border border-ink-300/60 bg-white p-5 shadow-card">
            <p className="text-sm text-ink-500">Asset mismatches</p>
            <p className={`mt-2 text-3xl font-semibold ${summary?.asset_mismatches > 0 ? "text-red-600" : "text-ink-900"}`}>{summary?.asset_mismatches ?? "—"}</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-ink-500">
          An asset mismatch is recorded when an item declared at sign-in is not confirmed as returned at checkout.
        </p>
      </main>
    </div>
  );
}
