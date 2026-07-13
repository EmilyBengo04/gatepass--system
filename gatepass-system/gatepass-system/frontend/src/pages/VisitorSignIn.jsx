import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { enqueue, isNetworkError } from "../offlineQueue";
import { cacheEmployeeDirectory, getCachedEmployeeDirectory } from "../offlineCache";
import OfflineBanner from "../components/OfflineBanner";

const emptyAsset = () => ({ category: "gadget", ownership: "personal", identifier: "" });

export default function VisitorSignIn() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", host_employee_id: "", purpose: "" });
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api
      .get("/employees")
      .then((data) => {
        setEmployees(data.employees);
        cacheEmployeeDirectory(data.employees);
      })
      .catch(() => {
        // Offline (or the request otherwise failed) — fall back to whatever
        // directory we last saw, so the host dropdown still works.
        setEmployees(getCachedEmployeeDirectory());
      });
  }, []);

  function updateAsset(idx, field, value) {
    setAssets((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.phone.trim() || !form.host_employee_id) {
      setError("Please fill in your name, phone number, and who you're visiting.");
      return;
    }
    setSubmitting(true);
    const cleanAssets = assets
      .filter((a) => a.identifier.trim())
      .map((a) => ({ ...a, category: a.category === "vehicle" ? "vehicle" : "other" }));

    try {
      const data = await api.post("/visitors/signin", { ...form, assets: cleanAssets });
      setResult(data);
    } catch (err) {
      if (isNetworkError(err)) {
        enqueue("visitor-signin", { ...form, assets: cleanAssets });
        const host = employees.find((e) => e.id === form.host_employee_id);
        setResult({
          queued: true,
          timeIn: new Date().toISOString(),
          host: host ? { name: host.name, department: host.department } : null,
        });
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900/[0.02] px-4">
        <div className="w-full max-w-md rounded-2xl border border-ink-300/60 bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">✓</div>
          <h1 className="text-xl font-semibold text-ink-900">You're signed in</h1>
          {result.queued ? (
            <p className="mt-2 text-sm text-ink-500">
              No connection right now — this will finish syncing automatically once we're back online, and{" "}
              {result.host?.name || "your host"} will be notified by email at that point.
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink-500">
              {result.host?.name} in {result.host?.department} has been notified by email that you've arrived.
            </p>
          )}
          <p className="mt-1 text-xs text-ink-500">Arrived at {new Date(result.timeIn).toLocaleTimeString()}</p>
          <p className="mt-4 text-sm text-ink-700">Please take a seat — someone will be with you shortly.</p>
          <Link to="/" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-900/[0.02] px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-6 inline-block text-sm text-ink-500 hover:text-ink-900">
          ← Back to home
        </Link>

        <OfflineBanner />

        <form onSubmit={handleSubmit} className="rounded-2xl border border-ink-300/60 bg-white p-8 shadow-card">
          <h1 className="text-xl font-semibold text-ink-900">Visitor sign-in</h1>
          <p className="mt-1 text-sm text-ink-500">Tell us a bit about your visit — your host will be notified right away.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Full name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Email (optional)</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Who are you visiting?</label>
              <select
                value={form.host_employee_id}
                onChange={(e) => setForm({ ...form, host_employee_id: e.target.value })}
                className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">Select a host…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.department}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Purpose of visit</label>
              <input
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                placeholder="e.g. Meeting, delivery, interview"
                className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-ink-700">Bringing any assets? (optional)</p>
              <div className="space-y-3">
                {assets.map((asset, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select
                      value={asset.category}
                      onChange={(e) => updateAsset(idx, "category", e.target.value)}
                      className="rounded-lg border border-ink-300 px-2 py-2 text-sm"
                    >
                      <option value="vehicle">Vehicle</option>
                      <option value="gadget">Gadget (laptop, etc.)</option>
                    </select>
                    <input
                      value={asset.identifier}
                      onChange={(e) => updateAsset(idx, "identifier", e.target.value)}
                      placeholder={asset.category === "vehicle" ? "Plate no." : "Description / serial no."}
                      className="flex-1 rounded-lg border border-ink-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setAssets((prev) => prev.filter((_, i) => i !== idx))}
                      className="px-2 text-ink-500 hover:text-red-600"
                      aria-label="Remove asset"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setAssets((prev) => [...prev, emptyAsset()])}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  + Add an asset
                </button>
              </div>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-navy-900 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
