// ============================================
// FILE: routes/CustomerRoutes/customerRoutes.js
// ============================================
import express from "express";
import CustomerControllers from "../../controllers/customer/CustomerControllers.js";
import { verifyAccessToken, refreshAccessToken, logout } from "../../middlewares/authMiddleware.js";
import twilio from "twilio";

const router = express.Router();

// -------------------- Twilio Setup (for test route) --------------------
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// -------------------- Helper: Format Phone Number --------------------
const formatPhoneNumber = (phone) => {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+91' + cleaned; // Change +91 to your country code
  }
  return cleaned;
};

// -------------------- TEST ROUTE (Add this for debugging) --------------------
router.post("/test-sms", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    
    const formatted = formatPhoneNumber(phoneNumber);
    
    console.log(`📞 Attempting to send SMS to: ${formatted}`);
    console.log(`📱 From: ${process.env.TWILIO_PHONE_NUMBER}`);
    
    const message = await twilioClient.messages.create({
      body: "✅ Test message from Car Wash - Your Twilio is working!",
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formatted,
    });
    
    console.log(`✅ SMS sent successfully! SID: ${message.sid}`);
    
    res.json({ 
      success: true, 
      sid: message.sid, 
      to: formatted,
      from: process.env.TWILIO_PHONE_NUMBER,
      status: message.status
    });
  } catch (error) {
    console.error("❌ SMS Test Error:", error);
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo 
    });
  }
});

// ==================== PUBLIC ROUTES (No Auth Required) ====================

// Authentication
router.post("/registerUser", CustomerControllers.registerUser);           // Step 1: Send OTP
router.post("/verifyOTP", CustomerControllers.verifyRegistrationOTP);     // Step 2: Verify OTP & Create Account
router.post("/login", CustomerControllers.loginUser);                     // Login
router.post("/refreshToken", refreshAccessToken);                         // Refresh token

// Forgot & Reset Password (3 Steps)
router.post("/forgotPassword", CustomerControllers.forgotPassword);       // Step 1: Send OTP
router.post("/verifyResetOTP", CustomerControllers.verifyResetOTP);       // Step 2: Verify OTP
router.post("/resetPassword", CustomerControllers.resetPassword);         // Step 3: Reset Password

// ==================== PROTECTED ROUTES (Auth Required) ====================

// Profile & Authentication
router.post("/logout", verifyAccessToken, logout);                        // ✅ Logout (clear refresh token)
router.get("/getUserById/:id", verifyAccessToken, CustomerControllers.getUserById);
router.put("/updateProfile/:id", verifyAccessToken, CustomerControllers.updateProfile);
router.delete("/deleteUser/:id", verifyAccessToken, CustomerControllers.deleteUser);

// Admin Only
router.get("/getAllUsers", verifyAccessToken, CustomerControllers.getAllUsers);

export default router;