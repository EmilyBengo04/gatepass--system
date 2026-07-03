export default function StatCard({ label, value, note, noteColor = "text-ink-500", icon: Icon }) {
  return (
    <div className="rounded-2xl border border-ink-300/60 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm text-ink-500">{label}</p>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900/5 text-ink-700">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold text-ink-900">{value}</p>
      {note && <p className={`mt-1 text-xs font-medium ${noteColor}`}>{note}</p>}
    </div>
  );
}
