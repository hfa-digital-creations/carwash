import jwt from "jsonwebtoken";
import Admin from "../models/AdminModels/adminRegistrationModel.js";

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
};

export const generateAndSaveTokens = async (userId) => {
  const { accessToken, refreshToken } = generateTokens(userId);
  await Admin.findByIdAndUpdate(userId, { refreshToken });
  return { accessToken, refreshToken };
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const admin = await Admin.findById(decoded.userId);
    if (!admin || admin.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const { accessToken: newAccessToken } = generateTokens(admin._id);
    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ message: "Token invalid or expired", error: err.message });
  }
};
