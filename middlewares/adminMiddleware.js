import jwt from "jsonwebtoken";
import Admin from "../models/AdminModels/adminRegistrationModel.js";
import admin from "firebase-admin";

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

export const superAdminOnly = (req, res, next) => {
  if (!req.admin || req.admin.role !== "superadmin") {
    return res.status(403).json({ message: "SuperAdmin privileges required" });
  }
  next();
};

export const logout = async (req, res) => {
  await Admin.findByIdAndUpdate(req.userId, { refreshToken: null });
  res.status(200).json({ message: "Logged out successfully" });
};

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const firebaseToken = req.headers["x-firebase-token"];
    if (!firebaseToken) return next();

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      expiryTime: new Date(decodedToken.exp * 1000),
      issuedAt: new Date(decodedToken.iat * 1000),
    };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid Firebase token", error: err.message });
  }
};

export const getFirebaseTokenExpiry = async (firebaseToken) => {
  const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
  return {
    expiryTime: new Date(decodedToken.exp * 1000),
    issuedAt: new Date(decodedToken.iat * 1000),
    uid: decodedToken.uid,
  };
};
