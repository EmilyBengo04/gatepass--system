export default function AssetBadges({ assets }) {
  if (!assets || assets.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {assets.map((a) => (
        <span
          key={a.id}
          title={`${a.category} · ${a.ownership}${a.mismatch ? " · not confirmed returned" : ""}`}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            a.mismatch ? "bg-red-50 text-red-700" : "bg-ink-900/5 text-ink-600"
          }`}
        >
          {a.category === "vehicle" ? "🚗" : a.category === "laptop" ? "💻" : "🎒"} {a.identifier}
          <span className="text-ink-500">({a.ownership})</span>
        </span>
      ))}
    </div>
  );
}
