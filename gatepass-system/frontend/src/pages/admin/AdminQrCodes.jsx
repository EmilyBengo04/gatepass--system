import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { ADMIN_NAV_ITEMS } from "./nav";
import { api } from "../../api";

function QrCard({ title, description, type, url }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl;
    api
      .getBlob(`/qrcodes/${type}.png`)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setImgUrl(objectUrl);
      })
      .catch((err) => setError(err.message));
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [type]);

  return (
    <div className="rounded-2xl border border-ink-300/60 bg-white p-6 text-center shadow-card">
      <h3 className="font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 text-sm text-ink-500">{description}</p>

      <div className="mx-auto mt-4 flex h-56 w-56 items-center justify-center rounded-xl border border-ink-300/60 bg-white p-3">
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : imgUrl ? (
          <img src={imgUrl} alt={`${title} QR code`} className="h-full w-full" />
        ) : (
          <p className="text-xs text-ink-500">Loading…</p>
        )}
      </div>

      {url && <p className="mt-3 break-all text-xs text-ink-500">{url}</p>}

      {imgUrl && (
        <a
          href={imgUrl}
          download={`${type}-signin-qr.png`}
          className="mt-4 inline-block rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-900/[0.03]"
        >
          Download PNG
        </a>
      )}
    </div>
  );
}

export default function AdminQrCodes() {
  const [urls, setUrls] = useState(null);

  useEffect(() => {
    api.get("/qrcodes").then((d) => setUrls(d));
  }, []);

  return (
    <div className="flex bg-ink-900/[0.02]">
      <Sidebar items={ADMIN_NAV_ITEMS} />
      <main className="h-screen flex-1 overflow-y-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">Gate QR codes</h1>
            <p className="mt-0.5 text-sm text-ink-500">
              Print these and post one at each gate. Each one links straight to the matching sign-in form.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
          >
            Print this page
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-2xl">
          <QrCard
            title="Employee sign-in"
            description="For staff badges / the employee gate"
            type="employee"
            url={urls?.employeeUrl}
          />
          <QrCard
            title="Visitor sign-in"
            description="For the visitor reception desk"
            type="visitor"
            url={urls?.visitorUrl}
          />
        </div>

        <div className="mt-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          These QR codes point to the domain set in the backend's <code className="rounded bg-white/60 px-1">FRONTEND_URL</code> environment
          variable. If that's still <code className="rounded bg-white/60 px-1">localhost</code>, update it to your real domain and restart the
          backend before printing these for production use — codes generated against localhost won't work on visitors' phones.
        </div>
      </main>
    </div>
  );
}
