// ============================================
// FILE: routes/AdminRoutes/passwordResetRoutes.js (Backend)
// ============================================
import express from "express";
import * as passwordResetController from "../../controllers/AdminControllers/passwordResetController.js";

const router = express.Router();

// Request OTP for password reset
router.post("/request-otp", passwordResetController.requestPasswordReset);

// Verify OTP
router.post("/verify-otp", passwordResetController.verifyOTP);

// Reset password with OTP
router.post("/reset-password", passwordResetController.resetPasswordWithOTP);

// Resend OTP
router.post("/resend-otp", passwordResetController.resendOTP);

export default router;