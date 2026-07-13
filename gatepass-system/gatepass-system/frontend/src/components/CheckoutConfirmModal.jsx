import { useState } from "react";

const icon = (category) => (category === "vehicle" ? "🚗" : category === "laptop" ? "💻" : "🎒");

export default function CheckoutConfirmModal({ personName, assets, onConfirm, onCancel, submitting }) {
  const [confirmed, setConfirmed] = useState(() => new Set(assets.map((a) => a.id)));

  function toggle(id) {
    setConfirmed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-ink-900">Confirm sign-out</h3>
        <p className="mt-1 text-sm text-ink-500">
          Check off each item {personName} is actually taking with them. Anything left unchecked
          will be flagged as not confirmed returned.
        </p>

        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {assets.map((a) => (
            <label
              key={a.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink-300/60 px-3 py-2.5 hover:bg-ink-900/[0.02]"
            >
              <input
                type="checkbox"
                checked={confirmed.has(a.id)}
                onChange={() => toggle(a.id)}
                className="h-4 w-4 rounded border-ink-300"
              />
              <span className="text-lg">{icon(a.category)}</span>
              <span className="flex-1 text-sm text-ink-900">
                {a.identifier}
                <span className="ml-1.5 text-xs text-ink-500">({a.ownership})</span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-lg border border-ink-300 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-900/[0.03] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(Array.from(confirmed))}
            disabled={submitting}
            className="flex-1 rounded-lg bg-navy-900 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60"
          >
            {submitting ? "Signing out…" : "Confirm sign-out"}
          </button>
        </div>
      </div>
    </div>
  );
}
