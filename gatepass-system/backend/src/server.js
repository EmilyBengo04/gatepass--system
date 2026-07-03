require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employee.routes");
const visitorRoutes = require("./routes/visitor.routes");
const visitsRoutes = require("./routes/visits.routes");
const adminRoutes = require("./routes/admin.routes");
const qrcodeRoutes = require("./routes/qrcodes.routes");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/visits", visitsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/qrcodes", qrcodeRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`GatePass API listening on port ${PORT}`));
