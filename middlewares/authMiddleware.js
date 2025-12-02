import admin from "../config/firebase.js";
import jwt from "jsonwebtoken";
import Customer from "../models/customerModels.js";

// -------------------- Generate Firebase Custom Token --------------------
export const generateFirebaseToken = async (userId, additionalClaims = {}) => {
  try {
    const customToken = await admin.auth().createCustomToken(userId.toString(), additionalClaims);
    return { customToken };
  } catch (error) {
    console.error("❌ Error generating Firebase token:", error);
    throw new Error("Failed to generate authentication token");
  }
};

// -------------------- Generate JWT Tokens (for testing/Postman) --------------------
export const generateJWTTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// -------------------- Combined Token Generation --------------------
export const generateTokens = async (userId, additionalClaims = {}) => {
  // Generate Firebase custom token
  const { customToken } = await generateFirebaseToken(userId, additionalClaims);
  
  // Generate JWT tokens for testing
  const { accessToken, refreshToken } = generateJWTTokens(userId);
  
  return { customToken, accessToken, refreshToken };
};

// -------------------- Verify Access Token (Supports both Firebase ID Token and JWT) --------------------
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

    let userId;

    // Try JWT verification first (for Postman testing)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
      userId = decoded.userId;
      console.log("✅ JWT token verified for user:", userId);
    } catch (jwtError) {
      // If JWT fails, try Firebase ID token
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;
        console.log("✅ Firebase ID token verified for user:", userId);
        
        req.firebaseUser = {
          uid: decodedToken.uid,
          email: decodedToken.email,
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

    // Get user from database
    const user = await Customer.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.userId = userId;
    req.user = user;
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

    // Verify JWT refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "your-refresh-secret");
    
    const user = await Customer.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new tokens
    const tokens = await generateTokens(user._id, {
      email: user.email,
      phoneNumber: user.phoneNumber,
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