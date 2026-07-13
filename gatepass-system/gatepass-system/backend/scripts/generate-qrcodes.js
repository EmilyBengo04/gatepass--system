// Generates high-resolution PNG QR codes for printing and posting at the
// gate — independent of the running app, so security/facilities can print
// these once and laminate them.
//
// Run with: npm run qrcodes   (from the backend/ folder)
// Output:   backend/qrcodes/employee-signin.png
//           backend/qrcodes/visitor-signin.png

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const baseUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const targets = [
  { name: "employee-signin", path: "/employee-signin" },
  { name: "visitor-signin", path: "/visitor-signin" },
];

async function main() {
  const outDir = path.join(__dirname, "..", "qrcodes");
  fs.mkdirSync(outDir, { recursive: true });

  for (const target of targets) {
    const url = `${baseUrl}${target.path}`;
    const outPath = path.join(outDir, `${target.name}.png`);
    await QRCode.toFile(outPath, url, {
      type: "png",
      width: 1024, // print-friendly resolution
      margin: 4, // standard quiet zone — thin margins make cameras struggle to locate the code
      errorCorrectionLevel: "H", // tolerates ~30% damage — matters a lot once this is printed/laminated
      color: { dark: "#0F1B2D", light: "#FFFFFF" },
    });
    console.log(`Generated ${outPath}  ->  ${url}`);
  }

  console.log("\nDone. Print these at actual size (roughly 8x8cm minimum) and laminate for the gate.");
  console.log("If FRONTEND_URL in .env is still localhost, update it to your real domain and re-run before printing for production.");
}

main().catch((err) => {
  console.error("Failed to generate QR codes:", err);
  process.exitCode = 1;
});
