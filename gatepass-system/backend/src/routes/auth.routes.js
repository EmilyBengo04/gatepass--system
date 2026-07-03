const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
};

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const { rows } = await pool.query(
    "SELECT id, name, email, password_hash, role, active FROM users WHERE email = $1",
    [email.toLowerCase().trim()]
  );
  const user = rows[0];

  if (!user || !user.active) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.cookie("gatepass_token", token, COOKIE_OPTS);
  res.json({
    token, // also returned so a frontend that prefers header-based auth can use it
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.post("/logout", (req, res) => {
  res.clearCookie("gatepass_token");
  res.json({ ok: true });
});

router.get("/me", requireAuth(), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
