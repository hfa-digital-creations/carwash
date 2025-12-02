// middlewares/firebaseMiddleware.js
import admin from "../config/firebase.js";

/**
 * Verify Firebase ID Token from headers:
 * - Accepts `x-firebase-token: <idToken>` or `Authorization: Bearer <idToken>`
 * - If token absent → next() (non-strict)
 * - If invalid → 401
 * - On success → sets req.firebaseUser = { uid, email, issuedAt, expiryTime }
 */
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const headerToken = req.headers["x-firebase-token"];
    const auth = req.headers.authorization;
    const bearerToken = auth?.startsWith("Bearer ") ? auth.split(" ")[1] : null;
    const token = headerToken || bearerToken;
    if (!token) return next();

    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email,
      issuedAt: decoded.iat ? new Date(decoded.iat * 1000) : null,
      expiryTime: decoded.exp ? new Date(decoded.exp * 1000) : null
    };
    return next();
  } catch (error) {
    console.error("verifyFirebaseToken error:", error.message);
    return res.status(401).json({ message: "Invalid or expired Firebase token", error: error.message });
  }
};
