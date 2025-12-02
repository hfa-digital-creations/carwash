import express from "express";
import * as adminController from "../../controllers/AdminControllers/adminRegistrationControllers.js";
import { verifyAdminAccessToken, superAdminOnly, logout, verifyFirebaseToken, getFirebaseTokenExpiry } from "../../middlewares/adminMiddleware.js";
import { refreshAccessToken } from "../../utils/tokenUtils.js";

const router = express.Router();

// Public
router.post("/login", adminController.loginAdmin);
router.post("/refresh-token", refreshAccessToken);

// Protected
router.post("/logout", verifyAdminAccessToken, logout);
router.get("/profile", verifyAdminAccessToken, adminController.getProfile);
router.put("/change-password", verifyAdminAccessToken, adminController.changePassword);

// SuperAdmin Only
router.post("/register", verifyAdminAccessToken, superAdminOnly, adminController.registerAdmin);
router.get("/getAllAdmins", verifyAdminAccessToken, superAdminOnly, adminController.getAllAdmins);
router.get("/getAdminById/:id", verifyAdminAccessToken, superAdminOnly, adminController.getAdminById);
router.put("/updateAdmin/:id", verifyAdminAccessToken, superAdminOnly, adminController.updateAdmin);
router.delete("/deleteAdmin/:id", verifyAdminAccessToken, superAdminOnly, adminController.deleteAdmin);

// Firebase
router.get("/verify-firebase", verifyAdminAccessToken, verifyFirebaseToken, (req, res) => {
  res.status(200).json({ message: "Firebase verified", firebaseUser: req.firebaseUser || null });
});

router.post("/firebase-token-expiry", verifyAdminAccessToken, async (req, res) => {
  try {
    const { firebaseToken } = req.body;
    if (!firebaseToken) return res.status(400).json({ message: "Firebase token required" });

    const tokenInfo = await getFirebaseTokenExpiry(firebaseToken);
    res.status(200).json({ message: "Firebase token info", tokenInfo });
  } catch (err) {
    res.status(401).json({ message: "Invalid Firebase token", error: err.message });
  }
});

export default router;
