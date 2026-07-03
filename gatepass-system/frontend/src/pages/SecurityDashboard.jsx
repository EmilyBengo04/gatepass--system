import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import { api } from "../api";
import { PeopleIcon, VisitorIcon, SignOutArrowIcon } from "../components/icons";
import { NAV_ITEMS } from "./security/nav";

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function timeStr(d) {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function SecurityDashboard() {
  const [stats, setStats] = useState(null);
  const [active, setActive] = useState([]);
  const [recent, setRecent] = useState([]);
  const [now, setNow] = useState(new Date());
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [s, a, r] = await Promise.all([
        api.get("/visits/stats"),
        api.get("/visits/active"),
        api.get("/visits/recent?hours=1"),
      ]);
      setStats(s.stats);
      setActive(a.active);
      setRecent(r.recent);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    const dataTimer = setInterval(refresh, 15000);
    const clockTimer = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(dataTimer);
      clearInterval(clockTimer);
    };
  }, [refresh]);

  async function handleCheckout(visitLogId, assetIds = []) {
    try {
      await api.post(`/visits/${visitLogId}/checkout`, { confirmedAssetIds: assetIds });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const employeesInBuilding = active.filter((v) => v.visitor_type === "employee");
  const visitorsInBuilding = active.filter((v) => v.visitor_type === "visitor");

  return (
    <div className="flex bg-ink-900/[0.02]">
      <Sidebar items={NAV_ITEMS} />

      <main className="h-screen flex-1 overflow-y-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">Security dashboard</h1>
            <p className="mt-0.5 text-sm text-ink-500">
              Live occupancy · {now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Live
            </span>
            <span className="text-sm text-ink-500">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total in building" value={stats?.total_in_building ?? "—"} icon={PeopleIcon} />
          <StatCard label="Employees present" value={stats?.employees_present ?? "—"} icon={PeopleIcon}
            note={stats ? `${stats.total_employees ? Math.round((stats.employees_present / stats.total_employees) * 100) : 0}% attendance` : ""} noteColor="text-green-600" />
          <StatCard label="Visitors on-site" value={stats?.visitors_on_site ?? "—"} icon={VisitorIcon} />
          <StatCard label="Sign-outs today" value={stats?.signouts_today ?? "—"} icon={SignOutArrowIcon} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-ink-300/60 bg-white p-5 shadow-card">
            <h2 className="font-semibold text-ink-900">Recent activity</h2>
            <p className="text-sm text-ink-500">Live gatepass events from the last hour</p>
            <div className="mt-4 divide-y divide-ink-300/50">
              {recent.length === 0 && <p className="py-6 text-center text-sm text-ink-500">No activity in the last hour.</p>}
              {recent.map((r) => {
                const signedOut = Boolean(r.time_out);
                return (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900/5 text-xs font-semibold text-ink-700">
                        {initials(r.person_name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-900">{r.person_name}</p>
                        <p className="text-xs text-ink-500">{r.department || r.host_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${signedOut ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
                        {signedOut ? "Signed out" : "Signed in"}
                      </span>
                      <span className="w-16 text-right text-xs text-ink-500">{timeStr(signedOut ? r.time_out : r.time_in)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-ink-300/60 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">Currently in building</h2>
              <span className="text-xs text-ink-500">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <p className="text-sm text-ink-500">{active.length} people on premises</p>
            <div className="mt-3 flex items-center gap-4 text-sm text-ink-700">
              <span className="flex items-center gap-1.5"><PeopleIcon className="h-4 w-4" /> {employeesInBuilding.length} employees</span>
              <span className="flex items-center gap-1.5"><VisitorIcon className="h-4 w-4" /> {visitorsInBuilding.length} visitors</span>
            </div>

            <div className="mt-4 max-h-96 space-y-1 overflow-y-auto">
              {active.length === 0 && <p className="py-6 text-center text-sm text-ink-500">Nobody currently on site.</p>}
              {active.map((v) => (
                <div key={v.id} className="group flex items-center justify-between rounded-lg px-2 py-2 hover:bg-ink-900/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/5 text-xs font-semibold text-ink-700">
                      {initials(v.person_name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">{v.person_name}</p>
                      <p className="text-xs text-ink-500">{v.department || `Visiting ${v.host_name}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-500">{timeStr(v.time_in)}</span>
                    <button
                      onClick={() => handleCheckout(v.id, v.assets.map((a) => a.id))}
                      className="hidden rounded-md border border-ink-300 px-2 py-1 text-xs font-medium text-ink-700 hover:bg-white group-hover:block"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
