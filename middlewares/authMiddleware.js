// ============================================
// FILE: middlewares/authMiddleware.js (Customer)
// ============================================
import jwt from "jsonwebtoken";
import Customer from "../models/customerModels.js";

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
  await Customer.findByIdAndUpdate(userId, { refreshToken });
  return { accessToken, refreshToken };
};

// ==================== MIDDLEWARE ====================

// Verify Access Token
export const verifyAccessToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await Customer.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// ==================== ROUTE HANDLERS ====================

// Logout Customer
export const logout = async (req, res) => {
  try {
    await Customer.findByIdAndUpdate(req.userId, { refreshToken: null });
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

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await Customer.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    // Update refresh token in database
    await Customer.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

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