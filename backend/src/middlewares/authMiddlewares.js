const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Cookie (browser) or Authorization / alternate headers (mobile & API clients).
 * Mobile apps often omit httpOnly cookies; some send the JWT as the full
 * Authorization value without a "Bearer " prefix, which breaks split(" ")[1].
 */
function getTokenFromRequest(req) {
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.length > 0) {
    const trimmed = auth.trim();
    const bearer = /^Bearer\s+(.+)$/i.exec(trimmed);
    if (bearer) {
      return bearer[1].trim();
    }
    if (!/\s/.test(trimmed)) {
      return trimmed;
    }
  }

  const alt = req.headers["x-access-token"] || req.headers["x-auth-token"];
  if (typeof alt === "string" && alt.trim()) {
    return alt.trim();
  }

  return null;
}

// Middleware to authenticate user
exports.authenticateUser = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized. No token received." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password"); // Exclude password
    if (!req.user) {
      return res.status(401).json({ message: "Invalid user" });
    }
    next();
  } catch (error) {
    const isExpired = error && (error.name === 'TokenExpiredError');
    console.error("Token verification error:", error.message);
    return res.status(isExpired ? 401 : 403).json({ message: isExpired ? "Session expired" : "Invalid token" });
  }
};

// Middleware to verify admin role
exports.verifyAdmin = (req, res, next) => {  
  // Only Admin role users can access admin routes
  if (!req.user || req.user.role !== "Admin") {
    // console.log('❌ Admin Access Denied - User role:', req.user?.role);
    return res.status(403).json({ 
      message: "Access denied. Admin role required.",
      userRole: req.user?.role || "No role",
      userAccessLevel: req.user?.accessLevel || "No access level"
    });
  }
    next();
};
