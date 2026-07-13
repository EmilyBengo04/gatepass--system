const express = require("express");
const createRouter = require("../utils/router");
const QRCode = require("qrcode");

const router = createRouter();

const TARGETS = {
  employee: "/employee-signin",
  visitor: "/visitor-signin",
};

function baseUrl() {
  // FRONTEND_URL is already configured in .env for CORS, so we reuse it here
  // as the domain the printed/displayed QR codes should point to.
  return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
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
      margin: 4, // standard quiet-zone width; too thin makes cameras struggle to find the code's edges
      errorCorrectionLevel: "H", // tolerates ~30% damage/glare/blur instead of ~15%, at the cost of denser modules
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
