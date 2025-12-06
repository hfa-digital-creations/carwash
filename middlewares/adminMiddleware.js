// ============================================
// FILE: middlewares/adminMiddleware.js
// ============================================
import jwt from "jsonwebtoken";
import Admin from "../models/AdminModels/adminRegistrationModel.js";

// ==================== TOKEN UTILITIES ====================

// Generate Access and Refresh Tokens
export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

// Generate Tokens and Save Refresh Token to Database
export const generateAndSaveTokens = async (userId) => {
  const { accessToken, refreshToken } = generateTokens(userId);
  await Admin.findByIdAndUpdate(userId, { refreshToken });
  return { accessToken, refreshToken };
};

// ==================== MIDDLEWARE ====================

// Verify Admin Access Token
export const verifyAdminAccessToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access token required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await Admin.findById(decoded.userId).select("-password");
    if (!adminUser) return res.status(404).json({ message: "Admin not found" });
    if (!adminUser.isActive) return res.status(403).json({ message: "Account is deactivated" });

    req.userId = decoded.userId;
    req.admin = adminUser;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// SuperAdmin Only Middleware
export const superAdminOnly = (req, res, next) => {
  if (!req.admin || req.admin.role !== "superadmin") {
    return res.status(403).json({ message: "SuperAdmin privileges required" });
  }
  next();
};

// ==================== ROUTE HANDLERS ====================

// Logout Admin
export const logout = async (req, res) => {
  try {
    await Admin.findByIdAndUpdate(req.userId, { refreshToken: null });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
};

// Refresh Access Token
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const admin = await Admin.findById(decoded.userId);
    if (!admin || admin.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(admin._id);
    
    // Update refresh token in database
    await Admin.findByIdAndUpdate(admin._id, { refreshToken: newRefreshToken });

    res.status(200).json({ 
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    res.status(401).json({ message: "Token invalid or expired", error: err.message });
  }
};