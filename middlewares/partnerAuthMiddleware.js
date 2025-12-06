// ============================================
// FILE: middlewares/partnerAuthMiddleware.js (Partner)
// ============================================
import jwt from "jsonwebtoken";
import Partner from "../models/partnerModel.js";
import { isTokenBlacklisted, isRefreshTokenBlacklisted } from "../controllers/partner/partnerControllers.js";

// ==================== TOKEN UTILITIES ====================

// Generate Access and Refresh Tokens
export const generateTokens = (partnerId) => {
  const accessToken = jwt.sign({ partnerId }, process.env.JWT_SECRET, { expiresIn: "1d" });
  const refreshToken = jwt.sign({ partnerId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

// Generate Tokens and Save Refresh Token to Database
export const generateAndSaveTokens = async (partnerId) => {
  const { accessToken, refreshToken } = generateTokens(partnerId);
  await Partner.findByIdAndUpdate(partnerId, { refreshToken });
  return { accessToken, refreshToken };
};

// ==================== MIDDLEWARE ====================

// Verify Access Token (WITHOUT isActive Check - for profile completion)
export const verifyAccessTokenWithoutActiveCheck = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ 
        message: "Token has been revoked. Please login again." 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const partner = await Partner.findById(decoded.partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // NO isActive check - allow even if not approved by admin

    req.partnerId = decoded.partnerId;
    req.partner = partner;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Verify Access Token (WITH isActive Check - for normal operations)
export const verifyAccessToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ 
        message: "Token has been revoked. Please login again." 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const partner = await Partner.findById(decoded.partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Check if partner is active (admin approval required)
    if (!partner.isActive) {
      return res.status(403).json({ 
        message: "Your account is pending admin approval",
        isActive: false
      });
    }

    req.partnerId = decoded.partnerId;
    req.partner = partner;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Role-based Middleware
export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.partner) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.partner.role)) {
      return res.status(403).json({ 
        message: "Access denied. Your role does not have permission.",
        yourRole: req.partner.role,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
};

// ==================== ROUTE HANDLERS ====================

// Logout Partner
export const logout = async (req, res) => {
  try {
    await Partner.findByIdAndUpdate(req.partnerId, { refreshToken: null });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
};

// Refresh Access Token
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    // Check if refresh token is blacklisted
    if (isRefreshTokenBlacklisted(refreshToken)) {
      return res.status(401).json({ 
        message: "Refresh token has been revoked. Please login again." 
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const partner = await Partner.findById(decoded.partnerId);
    if (!partner || partner.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(partner._id);
    
    // Update refresh token in database
    await Partner.findByIdAndUpdate(partner._id, { refreshToken: newRefreshToken });

    res.status(200).json({ 
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token expired, please login again" });
    }
    res.status(401).json({ message: "Token invalid or expired", error: err.message });
  }
};