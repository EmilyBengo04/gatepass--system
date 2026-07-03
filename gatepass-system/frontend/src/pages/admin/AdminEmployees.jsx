import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { ADMIN_NAV_ITEMS } from "./nav";
import { api } from "../../api";

const emptyForm = { employee_code: "", name: "", department: "", designation: "", email: "", phone: "" };

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadEmployees() {
    api.get("/employees?includeInactive=true").then((d) => setEmployees(d.employees));
  }

  useEffect(loadEmployees, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    if (!form.employee_code.trim() || !form.name.trim() || !form.department.trim()) {
      setError("Employee code, name, and department are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/employees", form);
      setForm(emptyForm);
      loadEmployees();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(emp) {
    await api.put(`/employees/${emp.id}`, { active: !emp.active });
    loadEmployees();
  }

  return (
    <div className="flex bg-ink-900/[0.02]">
      <Sidebar items={ADMIN_NAV_ITEMS} />
      <main className="h-screen flex-1 overflow-y-auto px-8 py-6">
        <h1 className="text-2xl font-semibold text-ink-900">Employees</h1>
        <p className="mt-0.5 text-sm text-ink-500">Manage the employee master list used for gate sign-in</p>

        <form onSubmit={handleAdd} className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-ink-300/60 bg-white p-5 shadow-card sm:grid-cols-3 lg:grid-cols-6">
          <input placeholder="Employee ID" value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          <input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          <input placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          <button disabled={submitting} className="rounded-lg bg-navy-900 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60">
            {submitting ? "Adding…" : "Add employee"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-5 overflow-hidden rounded-2xl border border-ink-300/60 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-900/[0.03] text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Designation</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/50">
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="px-4 py-3 text-ink-500">{emp.employee_code}</td>
                  <td className="px-4 py-3 font-medium text-ink-900">{emp.name}</td>
                  <td className="px-4 py-3 text-ink-700">{emp.department}</td>
                  <td className="px-4 py-3 text-ink-700">{emp.designation}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${emp.active !== false ? "bg-green-50 text-green-700" : "bg-ink-900/5 text-ink-500"}`}>
                      {emp.active !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleActive(emp)} className="text-xs font-medium text-brand-600 hover:underline">
                      {emp.active !== false ? "Deactivate" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
