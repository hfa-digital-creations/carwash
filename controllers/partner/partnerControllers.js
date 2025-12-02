import Partner from "../../models/partnerModel.js";
import OTP from "../../models/otpModels.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { generateTokens } from "../../middlewares/partnerAuthMiddleware.js";
import mongoose from "mongoose";

// -------------------- Lazy Initialization --------------------
let twilioClient = null;
let transporter = null;

const getTwilioClient = () => {
  if (!twilioClient) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
};

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

// -------------------- Helper Functions --------------------
const formatPhoneNumber = (phone) => {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+91' + cleaned;
  }
  return cleaned;
};

// In-memory storage
const registrationStore = {};
const passwordResetStore = {};

// ✅ Token Blacklist Storage
const tokenBlacklist = new Set();
const refreshTokenBlacklist = new Set();

// ✅ Helper: Add token to blacklist with auto-cleanup
const blacklistToken = (token, expiryTime = 24 * 60 * 60 * 1000) => {
  tokenBlacklist.add(token);
  setTimeout(() => {
    tokenBlacklist.delete(token);
    console.log(`🧹 Access token auto-removed from blacklist`);
  }, expiryTime);
};

const blacklistRefreshToken = (token, expiryTime = 7 * 24 * 60 * 60 * 1000) => {
  refreshTokenBlacklist.add(token);
  setTimeout(() => {
    refreshTokenBlacklist.delete(token);
    console.log(`🧹 Refresh token auto-removed from blacklist`);
  }, expiryTime);
};

// ✅ Export for middleware use
export const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

export const isRefreshTokenBlacklisted = (token) => {
  return refreshTokenBlacklist.has(token);
};

// ==================== REGISTRATION (WITH OTP) ====================

// -------------------- STEP 1: Register & Send OTP --------------------
const registerPartner = async (req, res) => {
  try {
    const { 
      fullName, email, phoneNumber, password, confirmPassword,
      dateOfBirth, gender, role, referredBy 
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phoneNumber || !password || !confirmPassword || !role) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate role
    const validRoles = ["Washing Personnel", "Delivery Person", "Repair Service Technician", "Product Seller"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check existing email
    const existingEmail = await Partner.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check existing phone
    const existingPhone = await Partner.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already exists" });
    }

    // Validate referral code if provided
    if (referredBy) {
      const referrer = await Partner.findOne({ referralCode: referredBy });
      if (!referrer) {
        return res.status(400).json({ message: "Invalid referral code" });
      }
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Delete existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Save OTP in database
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Store registration data temporarily (30 minutes for profile completion)
    registrationStore[phoneNumber] = {
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      password,
      dateOfBirth,
      gender,
      role,
      referredBy: referredBy || null,
      otpVerified: false,
      expiresAt: Date.now() + 30 * 60 * 1000,
    };

    console.log(`📝 Partner Registration OTP for ${phoneNumber}: ${otp}`);

    // Send OTP via SMS
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    try {
      await getTwilioClient().messages.create({
        body: `Your SparkleWash Partner registration OTP is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });

      console.log(`✅ SMS OTP sent to ${formattedPhone}`);

      return res.status(200).json({
        message: "OTP sent to your phone number ✅",
        phoneNumber: formattedPhone,
      });
    } catch (smsError) {
      console.error("❌ SMS error:", smsError.message);
      
      // Development mode: show OTP
      if (process.env.NODE_ENV === "development") {
        return res.status(200).json({
          message: "⚠️ SMS failed. OTP shown for testing.",
          phoneNumber: formattedPhone,
          otp,
          error: smsError.message,
        });
      }
      
      return res.status(500).json({ 
        message: "Failed to send OTP", 
        error: smsError.message 
      });
    }
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- STEP 2: Verify OTP (DON'T CREATE ACCOUNT YET) --------------------
// -------------------- STEP 2: Verify OTP & CREATE ACCOUNT --------------------
const verifyRegistrationOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ message: "Phone number and OTP are required" });
    }

    // Get stored registration data
    const registrationData = registrationStore[phoneNumber];
    if (!registrationData) {
      return res.status(400).json({ 
        message: "Registration session not found or expired. Please register again." 
      });
    }

    // Check if session expired
    if (registrationData.expiresAt < Date.now()) {
      delete registrationStore[phoneNumber];
      return res.status(400).json({ 
        message: "Registration session expired. Please register again." 
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: registrationData.email,
      isUsed: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found or already used" });
    }

    // Check OTP expiry
    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);

    // ✅ CREATE ACCOUNT NOW (with basic info only)
    const newPartner = await Partner.create({
      fullName: registrationData.fullName,
      email: registrationData.email,
      phoneNumber: registrationData.phoneNumber,
      password: hashedPassword,
      dateOfBirth: registrationData.dateOfBirth,
      gender: registrationData.gender,
      role: registrationData.role,
      referredBy: registrationData.referredBy,
      isVerified: true,
      isActive: false, // ✅ Admin approval needed
    });

    // ✅ Generate tokens
    const { customToken, accessToken, refreshToken } = await generateTokens(
      newPartner._id, 
      {
        email: newPartner.email,
        role: newPartner.role,
      }
    );

    // Clean up
    await OTP.deleteMany({ email: registrationData.email });
    delete registrationStore[phoneNumber];

    console.log(`✅ Partner registered: ${newPartner.email} (${newPartner.role})`);
    console.log(`⏳ Profile completion pending...`);

    return res.status(201).json({
      message: "Registration successful! ✅ Please complete your profile.",
      partner: {
        id: newPartner._id,
        fullName: newPartner.fullName,
        email: newPartner.email,
        phoneNumber: newPartner.phoneNumber,
        role: newPartner.role,
        referralCode: newPartner.referralCode,
        isActive: newPartner.isActive,
        profileComplete: false,
      },
      customToken,
      accessToken,
      refreshToken,
      nextStep: "Complete your profile with address, vehicle/shop, and payout details",
    });
  } catch (error) {
    console.error("❌ Verify OTP error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- STEP 3: Complete Profile (Requires Auth) --------------------
const completePartnerProfile = async (req, res) => {
  try {
    const { id } = req.params; // ✅ Get ID from URL params
    const profileData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid partner ID" });
    }

    // ✅ Get partner from database
    const partner = await Partner.findById(id);
    if (!partner) {
      return res.status(404).json({ 
        message: "Partner not found" 
      });
    }

    // ✅ Check if already profile completed (optional)
    // if (partner.address && partner.payoutDetails) {
    //   return res.status(400).json({ 
    //     message: "Profile already completed. Use updateProfile to edit." 
    //   });
    // }

    // ✅ Add profile-specific data
    if (profileData.address) partner.address = profileData.address;
    if (profileData.emergencyContact) partner.emergencyContact = profileData.emergencyContact;

    // Role-specific data
    const role = partner.role;
    switch (role) {
      case "Washing Personnel":
        if (profileData.serviceCategories) partner.serviceCategories = profileData.serviceCategories;
        if (profileData.vehicleDetails) partner.vehicleDetails = profileData.vehicleDetails;
        break;

      case "Delivery Person":
        if (profileData.vehicleDetails) partner.vehicleDetails = profileData.vehicleDetails;
        break;

      case "Repair Service Technician":
        if (profileData.shopDetails) partner.shopDetails = profileData.shopDetails;
        if (profileData.services) partner.services = profileData.services;
        if (profileData.yearsOfExperience) partner.yearsOfExperience = profileData.yearsOfExperience;
        if (profileData.specializations) partner.specializations = profileData.specializations;
        if (profileData.certifications) partner.certifications = profileData.certifications;
        if (profileData.profilePhoto) partner.profilePhoto = profileData.profilePhoto;
        if (profileData.idProof) partner.idProof = profileData.idProof;
        break;

      case "Product Seller":
        if (profileData.shopDetails) partner.shopDetails = profileData.shopDetails;
        if (profileData.products) partner.products = profileData.products;
        break;
    }

    // Payout details
    if (profileData.payoutDetails) partner.payoutDetails = profileData.payoutDetails;

    // ✅ Save profile
    await partner.save();

    console.log(`✅ Profile completed for: ${partner.email}`);
    console.log(`⏳ Waiting for admin approval...`);

    return res.status(200).json({
      message: "Profile completed successfully! ✅ Your account is pending admin approval.",
      partner: {
        id: partner._id,
        fullName: partner.fullName,
        email: partner.email,
        phoneNumber: partner.phoneNumber,
        role: partner.role,
        referralCode: partner.referralCode,
        isActive: partner.isActive,
        profileComplete: true,
      },
      note: "You can login after admin approval",
    });
  } catch (error) {
    console.error("❌ Complete profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== LOGIN ====================
const loginPartner = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: "Email/Phone and password are required" });
    }

    const partner = await Partner.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase() },
        { phoneNumber: emailOrPhone }
      ]
    });

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (!partner.isVerified) {
      return res.status(403).json({ message: "Please verify your account first" });
    }

    // ✅ Check if admin approved
    if (!partner.isActive) {
      return res.status(403).json({ 
        message: "Your account is pending admin approval. Please wait for activation.",
        isActive: false
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, partner.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const { customToken, accessToken, refreshToken } = await generateTokens(
      partner._id, 
      {
        email: partner.email,
        role: partner.role,
      }
    );

    console.log(`✅ Partner logged in: ${partner.email}`);

    res.status(200).json({
      message: "Login successful ✅",
      partner: {
        id: partner._id,
        fullName: partner.fullName,
        email: partner.email,
        phoneNumber: partner.phoneNumber,
        role: partner.role,
        referralCode: partner.referralCode,
        isActive: partner.isActive,
      },
      customToken,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== LOGOUT ====================
const logoutPartner = async (req, res) => {
  try {
    // Get tokens from request
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(' ')[1];
    const { refreshToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ 
        message: "No token provided" 
      });
    }

    // Blacklist access token (24 hours)
    blacklistToken(accessToken, 24 * 60 * 60 * 1000);
    console.log(`🚫 Access token blacklisted`);

    // Blacklist refresh token if provided (7 days)
    if (refreshToken) {
      blacklistRefreshToken(refreshToken, 7 * 24 * 60 * 60 * 1000);
      console.log(`🚫 Refresh token blacklisted`);
    }

    // Log partner info if available from middleware
    if (req.partner) {
      console.log(`👋 Partner logged out: ${req.partner.email} (${req.partner._id})`);
    }

    res.status(200).json({
      message: "Logout successful ✅",
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== FORGOT PASSWORD (WITH OTP) ====================

// -------------------- STEP 1: Send OTP --------------------
const forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({ message: "Email or phone number is required" });
    }

    const isEmail = emailOrPhone.includes("@");

    // Find partner
    const partner = await Partner.findOne(
      isEmail
        ? { email: emailOrPhone.toLowerCase() }
        : { phoneNumber: emailOrPhone }
    );

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store OTP data in memory
    passwordResetStore[emailOrPhone] = {
      otp,
      partnerId: partner._id,
      verified: false,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    console.log(`📝 Password reset OTP for ${emailOrPhone}: ${otp}`);

    // Send OTP
    try {
      if (isEmail) {
        await getTransporter().sendMail({
          from: `"SparkleWash Partners" <${process.env.EMAIL_USER}>`,
          to: emailOrPhone,
          subject: "Password Reset OTP",
          html: `
            <h2>Password Reset Request</h2>
            <p>Your password reset OTP is: <strong>${otp}</strong></p>
            <p>This OTP is valid for 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `,
        });
        console.log(`✅ Email OTP sent to ${emailOrPhone}`);
      } else {
        const formattedPhone = formatPhoneNumber(emailOrPhone);
        await getTwilioClient().messages.create({
          body: `Your SparkleWash Partner password reset OTP is: ${otp}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });
        console.log(`✅ SMS OTP sent to ${formattedPhone}`);
      }

      return res.status(200).json({
        message: `OTP sent to your ${isEmail ? "email" : "phone number"} ✅`,
        sentTo: emailOrPhone,
      });
    } catch (sendError) {
      console.error(`❌ ${isEmail ? "Email" : "SMS"} error:`, sendError.message);

      // Development mode: show OTP
      if (process.env.NODE_ENV === "development") {
        return res.status(200).json({
          message: `⚠️ ${isEmail ? "Email" : "SMS"} service failed. OTP shown for testing only.`,
          sentTo: emailOrPhone,
          otp,
          error: sendError.message,
        });
      }

      return res.status(500).json({
        message: `Failed to send OTP via ${isEmail ? "email" : "SMS"}`,
        error: sendError.message
      });
    }
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- STEP 2: Verify OTP --------------------
const verifyResetOTP = async (req, res) => {
  try {
    const { emailOrPhone, otp } = req.body;

    if (!emailOrPhone || !otp) {
      return res.status(400).json({ message: "Email/Phone and OTP are required" });
    }

    const storedData = passwordResetStore[emailOrPhone];

    if (!storedData) {
      return res.status(400).json({ message: "OTP not found or expired. Please request a new OTP." });
    }

    if (storedData.expiresAt < Date.now()) {
      delete passwordResetStore[emailOrPhone];
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark as verified and extend expiry
    passwordResetStore[emailOrPhone].verified = true;
    passwordResetStore[emailOrPhone].expiresAt = Date.now() + 5 * 60 * 1000; // 5 more minutes

    res.status(200).json({
      message: "OTP verified successfully ✅",
      emailOrPhone,
    });
  } catch (error) {
    console.error("❌ Verify reset OTP error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- STEP 3: Reset Password --------------------
const resetPassword = async (req, res) => {
  try {
    const { emailOrPhone, newPassword, confirmPassword } = req.body;

    if (!emailOrPhone || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const storedData = passwordResetStore[emailOrPhone];

    if (!storedData) {
      return res.status(400).json({
        message: "Session expired. Please request a new OTP"
      });
    }

    if (!storedData.verified) {
      return res.status(400).json({ message: "Please verify OTP first" });
    }

    if (storedData.expiresAt < Date.now()) {
      delete passwordResetStore[emailOrPhone];
      return res.status(400).json({
        message: "Session expired. Please request a new OTP"
      });
    }

    const partner = await Partner.findById(storedData.partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Hash and save new password
    partner.password = await bcrypt.hash(newPassword, 10);
    await partner.save();

    // Clear OTP data
    delete passwordResetStore[emailOrPhone];

    console.log(`✅ Password reset successful for ${emailOrPhone}`);

    res.status(200).json({ message: "Password reset successfully ✅" });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== CRUD OPERATIONS ====================

// Get All Partners (with optional role filter)
const getAllPartners = async (req, res) => {
  try {
    const { role } = req.query;
    let filter = {};

    if (role) {
      const validRoles = ["Washing Personnel", "Delivery Person", "Repair Service Technician", "Product Seller"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      filter.role = role;
    }

    const partners = await Partner.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Partners fetched successfully",
      count: partners.length,
      partners,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Partner By ID
const getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const partner = await Partner.findById(id).select("-password");
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res.status(200).json({
      message: "Partner fetched successfully",
      partner
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Partner (for editing profile)
const updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    // Don't allow password update through this route
    delete updateData.password;
    delete updateData.role; // Role shouldn't be changed

    const updatedPartner = await Partner.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedPartner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res.status(200).json({
      message: "Partner updated successfully",
      partner: updatedPartner
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Partner
const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const deleted = await Partner.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res.status(200).json({ message: "Partner deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Toggle Partner Status (Admin Approval)
const togglePartnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    console.log("\n🔄 ===== TOGGLE PARTNER STATUS =====");
    console.log("📥 Request Params:", req.params);
    console.log("📥 Request Body:", req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ 
        message: "isActive must be a boolean",
        received: typeof isActive,
        value: isActive
      });
    }

    const currentPartner = await Partner.findById(id);
    if (!currentPartner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    console.log("📊 Current Status:", currentPartner.isActive, "→ New Status:", isActive);

    const partner = await Partner.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).select("-password");

    console.log("✅ Status Updated Successfully");
    console.log("🔄 ===== UPDATE COMPLETE =====\n");

    res.status(200).json({
      message: `Partner ${isActive ? "activated" : "deactivated"} successfully ✅`,
      partner: {
        id: partner._id,
        fullName: partner.fullName,
        email: partner.email,
        role: partner.role,
        isActive: partner.isActive,
      }
    });
  } catch (error) {
    console.error("❌ Toggle Status Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  registerPartner,
  verifyRegistrationOTP,
  completePartnerProfile,
  loginPartner,
  logoutPartner, // ✅ Added
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  getAllPartners,
  getPartnerById,
  updatePartner,
  deletePartner,
  togglePartnerStatus,
};
