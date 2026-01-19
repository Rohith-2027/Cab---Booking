const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    // Validate allowedRoles config
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      console.error("roleMiddleware misconfigured");
      return res.status(500).json({
        message: "Authorization configuration error",
      });
    }

    if (!req.user || !req.user.role) {
      return res.status(403).json({
        message: "Access denied: no role information",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied: insufficient permissions",
      });
    }

    next();
  };
};

export default roleMiddleware;
