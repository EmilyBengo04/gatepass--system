const express = require("express");

// A drop-in replacement for express.Router() that automatically catches
// rejected promises from async handlers and forwards them to next(err).
//
// Why this exists: in Express 4, if an async route handler throws (e.g. a
// database query fails), the rejection is NOT automatically caught. In
// modern Node.js, an unhandled promise rejection crashes the entire process
// by default — meaning one bad query could take down every other request
// in flight, not just the one that failed. Wrapping every handler here
// converts that crash into a normal next(err) call, which server.js's
// error-handling middleware turns into a clean 500 JSON response instead.
function createRouter() {
  const router = express.Router();
  const methods = ["get", "post", "put", "patch", "delete"];

  for (const method of methods) {
    const original = router[method].bind(router);
    router[method] = (path, ...handlers) => {
      const wrapped = handlers.map((handler) => {
        if (typeof handler !== "function") return handler;
        return (req, res, next) => {
          Promise.resolve(handler(req, res, next)).catch(next);
        };
      });
      return original(path, ...wrapped);
    };
  }

  return router;
}

module.exports = createRouter;
