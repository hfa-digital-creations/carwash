import admin from "../config/firebase.js";
import jwt from "jsonwebtoken";
import Partner from "../models/partnerModel.js";
import { isTokenBlacklisted, isRefreshTokenBlacklisted } from "../controllers/partner/partnerControllers.js";

// -------------------- Generate Firebase Custom Token --------------------
export const generateFirebaseToken = async (partnerId, additionalClaims = {}) => {
  try {
    const customToken = await admin.auth().createCustomToken(partnerId.toString(), additionalClaims);
    return { customToken };
  } catch (error) {
    console.error("❌ Error generating Firebase token:", error);
    throw new Error("Failed to generate authentication token");
  }
};

// -------------------- Generate JWT Tokens (for testing/Postman) --------------------
export const generateJWTTokens = (partnerId) => {
  const accessToken = jwt.sign(
    { partnerId: partnerId.toString() },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { partnerId: partnerId.toString() },
    process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// -------------------- Combined Token Generation --------------------
export const generateTokens = async (partnerId, additionalClaims = {}) => {
  // Generate Firebase custom token
  const { customToken } = await generateFirebaseToken(partnerId, additionalClaims);
  
  // Generate JWT tokens for testing
  const { accessToken, refreshToken } = generateJWTTokens(partnerId);
  
  return { customToken, accessToken, refreshToken };
};

// ✅ -------------------- Verify Access Token WITHOUT isActive Check --------------------
export const verifyAccessTokenWithoutActiveCheck = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const firebaseToken = req.headers["x-firebase-token"];
    
    let token = firebaseToken;
    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ 
        message: "Token has been revoked. Please login again." 
      });
    }

    let partnerId;

    // Try JWT verification first (for Postman testing)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
      partnerId = decoded.partnerId;
      console.log("✅ JWT token verified for partner:", partnerId);
    } catch (jwtError) {
      // If JWT fails, try Firebase ID token
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        partnerId = decodedToken.uid;
        console.log("✅ Firebase ID token verified for partner:", partnerId);
        
        req.firebaseUser = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: decodedToken.role,
          expiryTime: new Date(decodedToken.exp * 1000),
          issuedAt: new Date(decodedToken.iat * 1000),
        };
      } catch (firebaseError) {
        console.error("❌ Token verification failed:", firebaseError.message);
        return res.status(401).json({ 
          message: "Invalid token",
          hint: "Use the accessToken (JWT) for Postman testing, or idToken (Firebase) from client app"
        });
      }
    }

    // Get partner from database
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // ✅ NO isActive check - allow even if not approved by admin

    req.partnerId = partnerId;
    req.partner = partner;
    next();
  } catch (error) {
    console.error("❌ Token verification error:", error.message);
    return res.status(401).json({ message: "Invalid access token", error: error.message });
  }
};

// -------------------- Verify Access Token (WITH isActive Check) --------------------
export const verifyAccessToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const firebaseToken = req.headers["x-firebase-token"];
    
    let token = firebaseToken;
    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ 
        message: "Token has been revoked. Please login again." 
      });
    }

    let partnerId;

    // Try JWT verification first (for Postman testing)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
      partnerId = decoded.partnerId;
      console.log("✅ JWT token verified for partner:", partnerId);
    } catch (jwtError) {
      // If JWT fails, try Firebase ID token
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        partnerId = decodedToken.uid;
        console.log("✅ Firebase ID token verified for partner:", partnerId);
        
        req.firebaseUser = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: decodedToken.role,
          expiryTime: new Date(decodedToken.exp * 1000),
          issuedAt: new Date(decodedToken.iat * 1000),
        };
      } catch (firebaseError) {
        console.error("❌ Token verification failed:", firebaseError.message);
        return res.status(401).json({ 
          message: "Invalid token",
          hint: "Use the accessToken (JWT) for Postman testing, or idToken (Firebase) from client app"
        });
      }
    }

    // Get partner from database
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // ✅ Check if partner is active (admin approval required)
    if (!partner.isActive) {
      return res.status(403).json({ 
        message: "Your account is pending admin approval",
        isActive: false
      });
    }

    req.partnerId = partnerId;
    req.partner = partner;
    next();
  } catch (error) {
    console.error("❌ Token verification error:", error.message);
    return res.status(401).json({ message: "Invalid access token", error: error.message });
  }
};

// -------------------- Refresh Token Handler --------------------
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

    // Verify JWT refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "your-refresh-secret");
    
    const partner = await Partner.findById(decoded.partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Generate new tokens
    const tokens = await generateTokens(partner._id, {
      email: partner.email,
      role: partner.role,
    });

    res.status(200).json({
      message: "Token refreshed successfully",
      ...tokens,
    });
  } catch (error) {
    console.error("❌ Token refresh error:", error);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Refresh token expired, please login again" });
    }
    return res.status(401).json({ message: "Invalid refresh token", error: error.message });
  }
};

// -------------------- Role-based Middleware --------------------
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

// -------------------- Admin-only Middleware --------------------
export const verifyAdmin = async (req, res, next) => {
  try {
    // You can check if user has admin role or use a separate Admin model
    // For now, this is a placeholder
    const adminToken = req.headers["x-admin-token"];
    
    if (!adminToken || adminToken !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    return res.status(403).json({ message: "Admin verification failed" });
  }
};