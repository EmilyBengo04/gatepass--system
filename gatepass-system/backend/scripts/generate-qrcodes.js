require("dotenv").config();

const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const targets = {
  employee: "/employee-signin",
  visitor: "/visitor-signin",
};

function resolveBaseUrl() {
  const url =
    process.env.QR_BASE_URL ||
    process.env.FRONTEND_URL ||
    process.env.PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (!url) {
    throw new Error(
      "Set QR_BASE_URL or FRONTEND_URL to your deployed app domain, for example https://gatepass.example.com"
    );
  }

  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const baseUrl = withProtocol.replace(/\/$/, "");

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(baseUrl) && process.env.ALLOW_LOCAL_QR !== "true") {
    throw new Error(
      "Refusing to generate printable QR codes for localhost. Set QR_BASE_URL to your Vercel/domain URL, or set ALLOW_LOCAL_QR=true for local testing."
    );
  }

  return baseUrl;
}

async function main() {
  const baseUrl = resolveBaseUrl();
  const outDir = path.join(__dirname, "..", "generated-qrcodes");

  fs.mkdirSync(outDir, { recursive: true });

  for (const [type, route] of Object.entries(targets)) {
    const url = `${baseUrl}${route}`;
    const file = path.join(outDir, `${type}-signin.png`);

    await QRCode.toFile(file, url, {
      type: "png",
      width: 1024,
      margin: 2,
      color: { dark: "#0F1B2D", light: "#FFFFFF" },
    });

    console.log(`${type}: ${url}`);
    console.log(`saved: ${file}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
