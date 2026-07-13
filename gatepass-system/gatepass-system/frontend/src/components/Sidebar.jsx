import { NavLink } from "react-router-dom";
import { useAuth } from "../auth-context";

export default function Sidebar({ items }) {
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-60 flex-col bg-navy-950 text-ink-300">
      <div className="flex items-center gap-2 px-6 py-5 text-white">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
          <path d="M12 2.5l7.5 3v6c0 5-3.5 8.5-7.5 10-4-1.5-7.5-5-7.5-10v-6l7.5-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        <span className="text-lg font-semibold">GatePass</span>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                isActive ? "bg-white/10 text-white" : "text-ink-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="truncate text-sm font-medium text-white">{user?.name}</p>
        <p className="truncate text-xs capitalize text-ink-500">{user?.role}</p>
        <button onClick={logout} className="mt-2 text-xs font-medium text-ink-300 hover:text-white">
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function icon(paths) {
  return function Icon({ className }) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        {paths}
      </svg>
    );
  };
}
