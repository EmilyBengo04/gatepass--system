const express = require("express");
const QRCode = require("qrcode");

const router = express.Router();

const TARGETS = {
  employee: "/employee-signin",
  visitor: "/visitor-signin",
};

function baseUrl() {
  const url =
    process.env.QR_BASE_URL ||
    process.env.FRONTEND_URL ||
    process.env.PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:5173";

  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  return withProtocol.replace(/\/$/, "");
}

// Public: returns the full sign-in URLs (handy for display alongside the QR
// image). No auth required — these URLs are meant to be public and posted
// at the gate, and the home page needs to show them to signed-out visitors.
router.get("/", (req, res) => {
  res.json({
    employeeUrl: `${baseUrl()}${TARGETS.employee}`,
    visitorUrl: `${baseUrl()}${TARGETS.visitor}`,
  });
});

// Public: streams a PNG QR code for the requested gate ("employee" or "visitor").
router.get("/:type.png", async (req, res) => {
  const path = TARGETS[req.params.type];
  if (!path) return res.status(404).json({ error: "Unknown QR code type." });

  try {
    const png = await QRCode.toBuffer(`${baseUrl()}${path}`, {
      type: "png",
      width: 512,
      margin: 2,
      color: { dark: "#0F1B2D", light: "#FFFFFF" },
    });
    res.set("Content-Type", "image/png");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(png);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not generate QR code." });
  }
});

module.exports = router;
