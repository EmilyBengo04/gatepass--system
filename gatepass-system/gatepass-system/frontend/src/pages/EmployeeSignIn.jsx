import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { enqueue, isNetworkError } from "../offlineQueue";
import { cacheEmployee, getCachedEmployee } from "../offlineCache";
import OfflineBanner from "../components/OfflineBanner";
import CheckoutConfirmModal from "../components/CheckoutConfirmModal";

const emptyAsset = () => ({ category: "vehicle", ownership: "personal", identifier: "" });

export default function EmployeeSignIn() {
  const [code, setCode] = useState("");
  const [employee, setEmployee] = useState(null);
  const [openVisit, setOpenVisit] = useState(null); // null = not signed in, object = signed in, undefined = unknown (offline)
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(""); // '', 'looking-up', 'submitting', 'done'
  const [result, setResult] = useState(null);
  const [manualAction, setManualAction] = useState(null); // 'in' | 'out' | null — used only when status is unknown offline
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  async function lookup(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setManualAction(null);
    const trimmed = code.trim();
    if (!trimmed) return;
    setStatus("looking-up");
    try {
      const data = await api.get(`/employees/${encodeURIComponent(trimmed)}`);
      setEmployee(data.employee);
      setOpenVisit(data.openVisit);
      setAssets([]);
      cacheEmployee(trimmed, data.employee);
    } catch (err) {
      if (isNetworkError(err)) {
        const cached = getCachedEmployee(trimmed);
        if (cached) {
          setEmployee(cached);
          setOpenVisit(undefined); // can't verify current status without a connection
          setAssets([]);
        } else {
          setEmployee(null);
          setError("You're offline and this ID isn't saved locally yet. Please try again once you have a connection.");
        }
      } else {
        setEmployee(null);
        setOpenVisit(null);
        setError(err.message);
      }
    } finally {
      setStatus("");
    }
  }

  function updateAsset(idx, field, value) {
    setAssets((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  }

  async function handleSignIn() {
    setStatus("submitting");
    setError("");
    const cleanAssets = assets.filter((a) => a.identifier.trim());
    try {
      await api.post(`/employees/${encodeURIComponent(employee.employee_code)}/signin`, { assets: cleanAssets });
      setResult({ type: "signed-in" });
      setEmployee(null);
      setCode("");
    } catch (err) {
      if (isNetworkError(err)) {
        enqueue("employee-signin", { code: employee.employee_code, assets: cleanAssets });
        setResult({ type: "signed-in", queued: true });
        setEmployee(null);
        setCode("");
      } else {
        setError(err.message);
      }
    } finally {
      setStatus("");
    }
  }

  async function handleSignOut(confirmedAssetIds) {
    setStatus("submitting");
    setError("");
    // Only send the key at all when we genuinely reviewed assets (online,
    // with declared items). Offline/unknown-status checkouts omit it
    // entirely — the backend treats an omitted key as "we don't know"
    // rather than "confirmed nothing", so it won't wrongly flag mismatches.
    const body = confirmedAssetIds !== undefined ? { confirmedAssetIds } : {};
    try {
      await api.post(`/employees/${encodeURIComponent(employee.employee_code)}/checkout`, body);
      setResult({ type: "signed-out" });
      setEmployee(null);
      setCode("");
    } catch (err) {
      if (isNetworkError(err)) {
        enqueue("employee-checkout", { code: employee.employee_code });
        setResult({ type: "signed-out", queued: true });
        setEmployee(null);
        setCode("");
      } else {
        setError(err.message);
      }
    } finally {
      setStatus("");
    }
  }

  function reset() {
    setResult(null);
    setEmployee(null);
    setOpenVisit(null);
    setCode("");
    setError("");
    setManualAction(null);
  }

  const statusUnknown = employee && openVisit === undefined && !manualAction;

  return (
    <div className="min-h-screen bg-ink-900/[0.02] px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/" className="mb-6 inline-block text-sm text-ink-500 hover:text-ink-900">
          ← Back to home
        </Link>

        <OfflineBanner />

        <div className="rounded-2xl border border-ink-300/60 bg-white p-8 shadow-card">
          <h1 className="text-xl font-semibold text-ink-900">Employee sign-in</h1>
          <p className="mt-1 text-sm text-ink-500">Enter your employee ID to sign in or sign out.</p>

          {result ? (
            <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800">
              {result.type === "signed-in" ? "You're signed in. Have a great day!" : "You're signed out. See you next time!"}
              {result.queued && (
                <p className="mt-1 text-xs text-green-700">
                  No connection right now — this will finish syncing automatically once we're back online.
                </p>
              )}
              <button onClick={reset} className="mt-3 block font-medium text-brand-600 hover:underline">
                Done
              </button>
            </div>
          ) : !employee ? (
            <form onSubmit={lookup} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700">Employee ID</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. EMP001"
                  className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={status === "looking-up"}
                className="w-full rounded-lg bg-navy-900 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
              >
                {status === "looking-up" ? "Looking up…" : "Continue"}
              </button>
            </form>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="rounded-lg bg-ink-900/[0.03] p-4">
                <p className="font-medium text-ink-900">{employee.name}</p>
                <p className="text-sm text-ink-500">{employee.designation} · {employee.department}</p>
                <p className="mt-1 text-xs text-ink-500">ID: {employee.employee_code}</p>
              </div>

              {statusUnknown ? (
                <div>
                  <p className="text-sm text-ink-700">
                    We can't check your current status while offline — what are you doing?
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setManualAction("in")}
                      className="rounded-lg border border-ink-300 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-900/[0.03]"
                    >
                      Signing in
                    </button>
                    <button
                      onClick={() => setManualAction("out")}
                      className="rounded-lg border border-ink-300 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-900/[0.03]"
                    >
                      Signing out
                    </button>
                  </div>
                </div>
              ) : (openVisit && openVisit !== undefined) || manualAction === "out" ? (
                <div>
                  <p className="text-sm text-ink-700">
                    {openVisit
                      ? `You're currently signed in (since ${new Date(openVisit.time_in).toLocaleTimeString()}).`
                      : "Confirm you'd like to sign out."}
                  </p>
                  {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                  <button
                    onClick={() =>
                      openVisit?.assets?.length > 0 ? setShowCheckoutModal(true) : handleSignOut()
                    }
                    disabled={status === "submitting"}
                    className="mt-4 w-full rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                  >
                    {status === "submitting" ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="mb-2 text-sm font-medium text-ink-700">Bringing any assets in? (optional)</p>
                  <div className="space-y-3">
                    {assets.map((asset, idx) => (
                      <div key={idx} className="flex gap-2">
                        <select
                          value={asset.category}
                          onChange={(e) => updateAsset(idx, "category", e.target.value)}
                          className="rounded-lg border border-ink-300 px-2 py-2 text-sm"
                        >
                          <option value="vehicle">Vehicle</option>
                          <option value="laptop">Laptop</option>
                          <option value="other">Other</option>
                        </select>
                        <select
                          value={asset.ownership}
                          onChange={(e) => updateAsset(idx, "ownership", e.target.value)}
                          className="rounded-lg border border-ink-300 px-2 py-2 text-sm"
                        >
                          <option value="personal">Personal</option>
                          <option value="company">Company</option>
                        </select>
                        <input
                          value={asset.identifier}
                          onChange={(e) => updateAsset(idx, "identifier", e.target.value)}
                          placeholder={asset.category === "vehicle" ? "Plate no." : "Serial no."}
                          className="flex-1 rounded-lg border border-ink-300 px-3 py-2 text-sm"
                        />
                        <button
                          onClick={() => setAssets((prev) => prev.filter((_, i) => i !== idx))}
                          className="px-2 text-ink-500 hover:text-red-600"
                          aria-label="Remove asset"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setAssets((prev) => [...prev, emptyAsset()])}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      + Add an asset
                    </button>
                  </div>

                  {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                  <button
                    onClick={handleSignIn}
                    disabled={status === "submitting"}
                    className="mt-5 w-full rounded-lg bg-navy-900 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
                  >
                    {status === "submitting" ? "Signing in…" : "Sign in"}
                  </button>
                </div>
              )}

              <button onClick={reset} className="w-full text-center text-sm text-ink-500 hover:text-ink-900">
                Not you? Start over
              </button>
            </div>
          )}
        </div>
      </div>

      {showCheckoutModal && (
        <CheckoutConfirmModal
          personName={employee.name}
          assets={openVisit.assets}
          submitting={status === "submitting"}
          onCancel={() => setShowCheckoutModal(false)}
          onConfirm={(confirmedIds) => {
            setShowCheckoutModal(false);
            handleSignOut(confirmedIds);
          }}
        />
      )}
    </div>
  );
}
