import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import { ADMIN_NAV_ITEMS } from "./admin/nav";
import { api } from "../api";
import { PeopleIcon, VisitorIcon, ReportIcon, ActivityIcon } from "../components/icons";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/visits/stats"),
      api.get("/admin/officer-activity"),
      api.get("/admin/reports/summary"),
    ])
      .then(([s, o, r]) => {
        setStats(s.stats);
        setOfficers(o.officers);
        setSummary(r.summary);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="flex bg-ink-900/[0.02]">
      <Sidebar items={ADMIN_NAV_ITEMS} />
      <main className="h-screen flex-1 overflow-y-auto px-8 py-6">
        <h1 className="text-2xl font-semibold text-ink-900">Admin overview</h1>
        <p className="mt-0.5 text-sm text-ink-500">Organisation-wide visibility across gates, staff, and visitors</p>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total in building" value={stats?.total_in_building ?? "—"} icon={PeopleIcon} />
          <StatCard label="Employees present" value={stats?.employees_present ?? "—"} icon={PeopleIcon} />
          <StatCard label="Visitors on-site" value={stats?.visitors_on_site ?? "—"} icon={VisitorIcon} />
          <StatCard label="Sign-ins today" value={stats?.signins_today ?? "—"} icon={ActivityIcon} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-ink-300/60 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">Security officers on duty today</h2>
              <Link to="/admin/officers" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
            </div>
            <p className="text-sm text-ink-500">Check-ins and check-outs processed per officer</p>
            <div className="mt-4 divide-y divide-ink-300/50">
              {officers.map((o) => (
                <div key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-ink-900">{o.name}</p>
                    <p className="text-xs capitalize text-ink-500">{o.role}</p>
                  </div>
                  <div className="text-right text-xs text-ink-500">
                    <p>{o.checkins_handled} check-ins</p>
                    <p>{o.checkouts_handled} check-outs</p>
                  </div>
                </div>
              ))}
              {officers.length === 0 && <p className="py-6 text-center text-sm text-ink-500">No officer activity yet today.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-ink-300/60 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">Last 7 days</h2>
              <Link to="/admin/reports" className="text-sm font-medium text-brand-600 hover:underline">Full report</Link>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Visitors</span><span className="font-medium text-ink-900">{summary?.visitor_count ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Employee sign-ins</span><span className="font-medium text-ink-900">{summary?.employee_signins ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Avg. dwell time</span><span className="font-medium text-ink-900">{summary?.avg_dwell_minutes ? `${summary.avg_dwell_minutes} min` : "—"}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Asset mismatches</span><span className={`font-medium ${summary?.asset_mismatches > 0 ? "text-red-600" : "text-ink-900"}`}>{summary?.asset_mismatches ?? "—"}</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
