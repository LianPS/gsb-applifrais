const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return next(new AppError("Authentification requise", 401));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError("Jeton invalide ou expiré", 401));
  }
}

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(new AppError("Accès interdit", 403));

module.exports = { requireAuth, requireRole };