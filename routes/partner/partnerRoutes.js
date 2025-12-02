import express from "express";
import PartnerControllers from "../../controllers/partner/partnerControllers.js";
import { 
  verifyAccessToken, 
  refreshAccessToken,
  verifyAccessTokenWithoutActiveCheck,
  checkRole 
} from "../../middlewares/partnerAuthMiddleware.js";
import { verifyAdminAccessToken, superAdminOnly } from "../../middlewares/adminMiddleware.js";

const router = express.Router();

// ==================== PUBLIC ROUTES (No Auth Required) ====================

// Registration Flow (WITH OTP)
router.post("/register", PartnerControllers.registerPartner);                    // Step 1: Send OTP
router.post("/verifyRegistrationOTP", PartnerControllers.verifyRegistrationOTP); // Step 2: Verify OTP (No account created yet)
router.put("/completeProfile/:id", verifyAccessTokenWithoutActiveCheck, PartnerControllers.completePartnerProfile);     // Step 3: Complete Profile & CREATE ACCOUNT

// Login, Logout & Token
router.post("/login", PartnerControllers.loginPartner);                          // Login (requires admin approval)
router.post("/logout", verifyAccessToken, PartnerControllers.logoutPartner);     // ✅ Logout (blacklist token)
router.post("/refreshToken", refreshAccessToken);                                // Refresh token

// Forgot Password Flow (WITH OTP)
router.post("/forgotPassword", PartnerControllers.forgotPassword);               // Step 1: Send OTP
router.post("/verifyResetOTP", PartnerControllers.verifyResetOTP);               // Step 2: Verify OTP
router.post("/resetPassword", PartnerControllers.resetPassword);                 // Step 3: Reset Password

// ==================== PROTECTED ROUTES (Auth Required) ====================

// Update Profile (requires authentication)
router.put("/updateProfile/:id", verifyAccessToken, PartnerControllers.updatePartner);

// Get Partners (Admin only)
router.get("/getAll", verifyAdminAccessToken, superAdminOnly, PartnerControllers.getAllPartners);
router.get("/getById/:id", verifyAdminAccessToken, superAdminOnly, PartnerControllers.getPartnerById);

// Delete Partner (requires authentication)
router.delete("/delete/:id", verifyAdminAccessToken, superAdminOnly, PartnerControllers.deletePartner);

// Admin Only: Toggle Active Status
router.patch("/toggleStatus/:id", verifyAdminAccessToken, superAdminOnly, PartnerControllers.togglePartnerStatus);

// ==================== ROLE-BASED ROUTE EXAMPLES ====================

// Example: Only Repair Technicians can access
// router.get("/technician-only", 
//   verifyAccessToken, 
//   checkRole("Repair Service Technician"),
//   (req, res) => {
//     res.json({ message: "Technician-only route", partner: req.partner });
//   }
// );

// Example: Multiple roles allowed
// router.get("/delivery-or-washing", 
//   verifyAccessToken, 
//   checkRole("Delivery Person", "Washing Personnel"),
//   (req, res) => {
//     res.json({ message: "Delivery or Washing Personnel route" });
//   }
// );

export default router;