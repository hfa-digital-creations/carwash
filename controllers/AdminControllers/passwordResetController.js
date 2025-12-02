// ============================================
// FILE: controllers/AdminControllers/passwordResetController.js (Backend)
// ============================================
import Admin from "../../models/AdminModels/adminRegistrationModel.js";
import OTP from "../../models/otpModels.js";
import { sendOTPEmail, sendPasswordChangedEmail } from "../../services/emailService.js";

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request OTP for Password Reset
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ message: "Admin with this email not found" });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Generate OTP
    const otp = generateOTP();

    // Delete old OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Save new OTP
    await OTP.create({
      email: email.toLowerCase(),
      otp: otp,
    });

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, admin.fullName);

    if (!emailResult.success) {
      return res.status(500).json({ 
        message: "Failed to send OTP email", 
        error: emailResult.error 
      });
    }

    res.status(200).json({
      message: "OTP sent successfully to your email",
      email: email.toLowerCase(),
    });
  } catch (err) {
    console.error("Request Password Reset Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp: otp,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Check if OTP is expired (10 minutes)
    const otpAge = Date.now() - otpRecord.createdAt.getTime();
    if (otpAge > 10 * 60 * 1000) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "OTP has expired" });
    }

    res.status(200).json({
      message: "OTP verified successfully",
      verified: true,
    });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Reset Password with OTP
export const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        message: "Email, OTP, and new password are required" 
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Find and verify OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp: otp,
      isUsed: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Check if OTP is expired
    const otpAge = Date.now() - otpRecord.createdAt.getTime();
    if (otpAge > 10 * 60 * 1000) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update password (will be hashed by the model's pre-save hook)
    admin.password = newPassword;
    await admin.save();

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Delete all OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Send confirmation email
    await sendPasswordChangedEmail(email, admin.fullName);

    res.status(200).json({
      message: "Password reset successfully",
      success: true,
    });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if admin exists
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ message: "Admin with this email not found" });
    }

    // Generate new OTP
    const otp = generateOTP();

    // Delete old OTPs
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Save new OTP
    await OTP.create({
      email: email.toLowerCase(),
      otp: otp,
    });

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, admin.fullName);

    if (!emailResult.success) {
      return res.status(500).json({ 
        message: "Failed to send OTP email", 
        error: emailResult.error 
      });
    }

    res.status(200).json({
      message: "New OTP sent successfully",
      email: email.toLowerCase(),
    });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};