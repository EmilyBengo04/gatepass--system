const jwt = require("jsonwebtoken");

function requireAuth(...allowedRoles) {
  return (req, res, next) => {
    const token = req.cookies?.gatepass_token || extractBearer(req);
    if (!token) {
      return res.status(401).json({ error: "Not authenticated." });
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (allowedRoles.length && !allowedRoles.includes(payload.role)) {
        return res.status(403).json({ error: "You do not have access to this resource." });
      }
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
  };
}

function extractBearer(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

module.exports = { requireAuth };
