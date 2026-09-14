const authorizeMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        status: "fail",
        message: "Forbidden: You do not have permission to perform this action",
      });
    }
    next();
  };
};

module.exports = authorizeMiddleware;