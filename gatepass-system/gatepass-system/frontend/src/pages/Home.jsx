import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth-context";
import { api, apiUrl } from "../api";

function ShieldLogo({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2.5l7.5 3v6c0 5-3.5 8.5-7.5 10-4-1.5-7.5-5-7.5-10v-6l7.5-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Icon({ name, className = "h-6 w-6" }) {
  const paths = {
    people: (
      <>
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M15 20c.3-2.6 2-4.6 4.4-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
    building: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 8h2M8 12h2M8 16h2M14 8h2M14 12h2M14 16h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
    qr: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <path d="M14 15h3m4 0h0M14 19h7M18 15v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
    shield: (
      <path d="M12 2.5l7.5 3v6c0 5-3.5 8.5-7.5 10-4-1.5-7.5-5-7.5-10v-6l7.5-3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    ),
    arrow: <path d="M4 10h11M10 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  const { user } = useAuth();
  const dashboardPath = user?.role === "admin" ? "/admin" : "/security";
  const [urls, setUrls] = useState(null);

  useEffect(() => {
    api.get("/qrcodes").then(setUrls).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-ink-300/60 px-8 py-4">
        <div className="flex items-center gap-2 text-ink-900">
          <ShieldLogo className="h-6 w-6" />
          <span className="text-lg font-semibold">GatePass</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm text-ink-500 hover:text-ink-900">
            Security dashboard
          </Link>
          <Link
            to={user ? dashboardPath : "/login"}
            className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
          >
            Go to dashboard <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden px-8 py-24 text-center"
        style={{
          backgroundColor: "#0F1B2D",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      >
        <div className="relative mx-auto max-w-3xl">
          <span className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-ink-300">
            <Icon name="qr" className="h-4 w-4" /> QR-code powered entry
          </span>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
            Smart building access <br />
            <span className="text-ink-300">made simple</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink-300">
            A digital gatepass system that streamlines entry for employees and visitors with
            real-time tracking and auditable records.
          </p>
        </div>
      </section>

      {/* Dual pathway cards */}
      <section className="mx-auto max-w-5xl px-8 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-ink-300/60 p-8 shadow-card sm:flex-row sm:items-start">
            <div className="flex-1">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon name="people" className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-ink-900">Employee sign-in</h3>
              <p className="mt-2 text-ink-500">
                Scan the employee QR code at the gate to sign in or sign out. Quick, secure, and
                tracked in real time.
              </p>
              <Link to="/employee-signin" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                Sign in now <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
            <div className="shrink-0 text-center">
              <div className="rounded-xl border border-ink-300/60 bg-white p-2">
                <img src={apiUrl("/qrcodes/employee.png")} alt="Employee sign-in QR code" className="h-36 w-36" />
              </div>
              <p className="mt-1.5 text-xs text-ink-500">Scan to sign in</p>
              {urls?.employeeUrl && (
                <p className="mt-1 max-w-[9rem] break-all text-[11px] text-ink-500/80">
                  Can't scan? Visit: {urls.employeeUrl.replace(/^https?:\/\//, "")}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 rounded-2xl border border-ink-300/60 p-8 shadow-card sm:flex-row sm:items-start">
            <div className="flex-1">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon name="building" className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-ink-900">Visitor sign-in</h3>
              <p className="mt-2 text-ink-500">
                Visiting the building? Scan the visitor QR code to register your entry, notify your
                host, and receive a temporary pass.
              </p>
              <Link to="/visitor-signin" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                Register now <Icon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
            <div className="shrink-0 text-center">
              <div className="rounded-xl border border-ink-300/60 bg-white p-2">
                <img src={apiUrl("/qrcodes/visitor.png")} alt="Visitor sign-in QR code" className="h-36 w-36" />
              </div>
              <p className="mt-1.5 text-xs text-ink-500">Scan to sign in</p>
              {urls?.visitorUrl && (
                <p className="mt-1 max-w-[9rem] break-all text-[11px] text-ink-500/80">
                  Can't scan? Visit: {urls.visitorUrl.replace(/^https?:\/\//, "")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Feature strip */}
        <div className="mt-16 grid gap-10 border-t border-ink-300/60 pt-12 sm:grid-cols-3">
          {[
            { icon: "qr", title: "QR code entry", desc: "Instant access via dedicated employee and visitor QR codes at every gate." },
            { icon: "shield", title: "Real-time security", desc: "Live dashboard shows who is in the building at any moment, with full audit trails." },
            { icon: "people", title: "Dual pathways", desc: "Separate flows for employees and visitors with relevant fields for each category." },
          ].map((f) => (
            <div key={f.title} className="text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-ink-900/5 text-ink-700">
                <Icon name={f.icon} className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-ink-900">{f.title}</h4>
              <p className="mt-1 text-sm text-ink-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
