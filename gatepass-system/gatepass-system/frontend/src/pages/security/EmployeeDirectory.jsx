import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { NAV_ITEMS } from "./nav";
import { api } from "../../api";

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      api.get(`/employees?search=${encodeURIComponent(search)}`).then((d) => setEmployees(d.employees));
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="flex bg-ink-900/[0.02]">
      <Sidebar items={NAV_ITEMS} />
      <main className="h-screen flex-1 overflow-y-auto px-8 py-6">
        <h1 className="text-2xl font-semibold text-ink-900">Employees</h1>
        <p className="mt-0.5 text-sm text-ink-500">Directory of active employees</p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or department…"
          className="mt-4 w-full max-w-sm rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />

        <div className="mt-4 overflow-hidden rounded-2xl border border-ink-300/60 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-900/[0.03] text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Designation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/50">
              {employees.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3 text-ink-500">{e.employee_code}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">{e.name}</td>
                  <td className="px-4 py-3 text-ink-700">{e.department}</td>
                  <td className="px-4 py-3 text-ink-700">{e.designation}</td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-500">No employees found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
