const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes - require valid JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized - no token provided" });
  }

  try {
    // Verify access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token has expired. Please refresh your token." });
    }
    return res.status(401).json({ message: "Not authorized - invalid token" });
  }
};

// Role-based access control
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This action is only available to: ${roles.join(", ")}. Your role: ${req.user.role}`,
      });
    }

    next();
  };

// Check if user is owner of resource (for profile edits, etc.)
const isOwner = async (req, res, next) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res
        .status(403)
        .json({
          message: "Access denied. You can only modify your own resources.",
        });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Authorization error" });
  }
};

// Deprecated - use authorize instead
const roleGuard =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: `Access denied. ${req.user.role}s cannot access this resource.`,
        });
    }
    next();
  };

module.exports = { protect, authorize, roleGuard, isOwner };
