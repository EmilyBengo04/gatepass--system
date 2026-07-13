import Sidebar from "../../components/Sidebar";
import { NAV_ITEMS } from "./nav";
import { useAuth } from "../../auth-context";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="flex bg-ink-900/[0.02]">
      <Sidebar items={NAV_ITEMS} />
      <main className="h-screen flex-1 overflow-y-auto px-8 py-6">
        <h1 className="text-2xl font-semibold text-ink-900">Settings</h1>
        <p className="mt-0.5 text-sm text-ink-500">Your account</p>

        <div className="mt-4 max-w-md rounded-2xl border border-ink-300/60 bg-white p-6 shadow-card">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink-500">Name</dt><dd className="font-medium text-ink-900">{user?.name}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Email</dt><dd className="font-medium text-ink-900">{user?.email}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Role</dt><dd className="font-medium capitalize text-ink-900">{user?.role}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-ink-500">
            To change your password or update account details, contact an administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
