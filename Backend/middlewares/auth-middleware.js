const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authenticateMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in. Please provide a valid token.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in. Please provide a valid token.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token no longer exists.",
      });
    }

    req.userId = user._id.toString();
    req.userRole = user.role;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

module.exports = authenticateMiddleware;
