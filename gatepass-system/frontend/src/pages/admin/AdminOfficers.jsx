import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { ADMIN_NAV_ITEMS } from "./nav";
import { api } from "../../api";

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminOfficers() {
  const [date, setDate] = useState(today());
  const [officers, setOfficers] = useState([]);

  useEffect(() => {
    api.get(`/admin/officer-activity?date=${date}`).then((d) => setOfficers(d.officers));
  }, [date]);

  return (
    <div className="flex bg-ink-900/[0.02]">
      <Sidebar items={ADMIN_NAV_ITEMS} />
      <main className="h-screen flex-1 overflow-y-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">Security officers</h1>
            <p className="mt-0.5 text-sm text-ink-500">Who was on duty and how many events they handled</p>
          </div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-ink-300 px-3 py-2 text-sm" />
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-ink-300/60 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-900/[0.03] text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Officer</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Check-ins handled</th>
                <th className="px-4 py-3 font-medium">Check-outs handled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/50">
              {officers.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{o.name}</td>
                  <td className="px-4 py-3 capitalize text-ink-700">{o.role}</td>
                  <td className="px-4 py-3 text-ink-700">{o.checkins_handled}</td>
                  <td className="px-4 py-3 text-ink-700">{o.checkouts_handled}</td>
                </tr>
              ))}
              {officers.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-500">No officer activity recorded for this date.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-ink-500">
          Note: check-ins are only attributed to an officer when processed from the security dashboard (self-service kiosk sign-ins have no officer attached).
        </p>
      </main>
    </div>
  );
}
