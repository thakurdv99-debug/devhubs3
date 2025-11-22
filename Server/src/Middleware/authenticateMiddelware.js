import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import user from "../Model/UserModel.js";
import { logger } from "../utils/logger.js";

const authMiddleware = async (req, res, next) => {
  try {
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      logger.error("JWT_SECRET environment variable is not set");
      return res.status(500).json({ message: "Server configuration error" });
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.debug("Authentication failed: No valid auth header", { 
        path: req.path, 
        method: req.method 
      });
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      logger.debug("Authentication failed: Missing user ID in token", { 
        path: req.path 
      });
      return res.status(401).json({ message: "Invalid token: Missing user ID" });
    }

    // Convert ID if necessary
    const objectId = mongoose.Types.ObjectId.isValid(decoded.id)
      ? new mongoose.Types.ObjectId(decoded.id)
      : decoded.id;

    // Fetch user from DB
    const loggedInUser = await user.findById(objectId).select("-password");

    if (!loggedInUser) {
      logger.debug("Authentication failed: User not found", { 
        userId: decoded.id,
        path: req.path 
      });
      return res.status(404).json({ message: "User not found" });
    }

    req.user = loggedInUser;
    logger.debug("Authentication successful", { 
      userId: loggedInUser._id.toString(),
      path: req.path 
    });
    next();
  } catch (error) {
    // Log error details server-side only
    logger.error("Authentication error", {
      error: error.message,
      errorName: error.name,
      path: req.path
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token format" });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    } else {
      return res.status(401).json({ message: "Invalid token" });
    }
  }
};

export default authMiddleware;
