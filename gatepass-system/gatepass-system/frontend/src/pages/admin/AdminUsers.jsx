import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { ADMIN_NAV_ITEMS } from "./nav";
import { api } from "../../api";

const emptyForm = { name: "", email: "", password: "", role: "security" };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadUsers() {
    api.get("/admin/users").then((d) => setUsers(d.users));
  }
  useEffect(loadUsers, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Name, email, and password are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/admin/users", form);
      setForm(emptyForm);
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(user) {
    await api.put(`/admin/users/${user.id}/active`, { active: !user.active });
    loadUsers();
  }

  return (
    <div className="flex bg-ink-900/[0.02]">
      <Sidebar items={ADMIN_NAV_ITEMS} />
      <main className="h-screen flex-1 overflow-y-auto px-8 py-6">
        <h1 className="text-2xl font-semibold text-ink-900">User accounts</h1>
        <p className="mt-0.5 text-sm text-ink-500">Security and admin accounts that can log in to the dashboards</p>

        <form onSubmit={handleAdd} className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-ink-300/60 bg-white p-5 shadow-card sm:grid-cols-5">
          <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          <input placeholder="Temporary password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-lg border border-ink-300 px-3 py-2 text-sm">
            <option value="security">Security</option>
            <option value="admin">Admin</option>
          </select>
          <button disabled={submitting} className="rounded-lg bg-navy-900 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60">
            {submitting ? "Adding…" : "Add user"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-5 overflow-hidden rounded-2xl border border-ink-300/60 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-900/[0.03] text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/50">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{u.name}</td>
                  <td className="px-4 py-3 text-ink-700">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-ink-700">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.active ? "bg-green-50 text-green-700" : "bg-ink-900/5 text-ink-500"}`}>
                      {u.active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleActive(u)} className="text-xs font-medium text-brand-600 hover:underline">
                      {u.active ? "Disable" : "Re-enable"}
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
