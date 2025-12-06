// ============================================
// FILE: routes/AdminRoutes/adminRoutes.js
// ============================================
import express from "express";
import * as adminController from "../../controllers/AdminControllers/adminRegistrationControllers.js";
import * as passwordResetController from "../../controllers/AdminControllers/passwordResetController.js";
import { 
  verifyAdminAccessToken, 
  superAdminOnly, 
  logout, 
  refreshAccessToken 
} from "../../middlewares/adminMiddleware.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Authentication
router.post("/login", adminController.loginAdmin);
router.post("/refresh-token", refreshAccessToken);

// Password Reset (OTP-based)
router.post("/request-password-reset", passwordResetController.requestPasswordReset);
router.post("/verify-otp", passwordResetController.verifyOTP);
router.post("/reset-password", passwordResetController.resetPasswordWithOTP);
router.post("/resend-otp", passwordResetController.resendOTP);

// ==================== PROTECTED ROUTES (All Admins) ====================

// Profile & Authentication
router.post("/logout", verifyAdminAccessToken, logout);
router.get("/profile", verifyAdminAccessToken, adminController.getProfile);

// ==================== SUPERADMIN ONLY ROUTES ====================

// Admin Management
router.post("/register", verifyAdminAccessToken, superAdminOnly, adminController.registerAdmin);
router.get("/getAllAdmins", verifyAdminAccessToken, superAdminOnly, adminController.getAllAdmins);
router.get("/getAdminById/:id", verifyAdminAccessToken, superAdminOnly, adminController.getAdminById);
router.put("/updateAdmin/:id", verifyAdminAccessToken, superAdminOnly, adminController.updateAdmin);
router.delete("/deleteAdmin/:id", verifyAdminAccessToken, superAdminOnly, adminController.deleteAdmin);

export default router;