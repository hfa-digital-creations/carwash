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

// Token Blacklist Storage
const tokenBlacklist = new Set();
const refreshTokenBlacklist = new Set();

// Helper: Add token to blacklist with auto-cleanup
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

// Export for middleware use
export const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

export const isRefreshTokenBlacklisted = (token) => {
  return refreshTokenBlacklist.has(token);
};

// ==================== STEP 1: REGISTER & SEND OTP ====================
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

    // Delete existing OTPs
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Save OTP
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Store registration data temporarily
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

    console.log(`📝 Registration OTP for ${phoneNumber}: ${otp}`);

    // Send OTP via SMS
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    try {
      await getTwilioClient().messages.create({
        body: `Your SparkleWash Partner registration OTP is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });

      console.log(`✅ SMS sent to ${formattedPhone}`);

      return res.status(200).json({
        message: "OTP sent to your phone number ✅",
        phoneNumber: formattedPhone,
      });
    } catch (smsError) {
      console.error("❌ SMS error:", smsError.message);
      
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

// ==================== STEP 2: VERIFY OTP & CREATE ACCOUNT ====================
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

    // Hash password
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);

    // CREATE ACCOUNT (basic info only)
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
      isActive: false,
    });

    // Generate tokens (accessToken & refreshToken only)
    const { accessToken, refreshToken } = await generateTokens(
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
      accessToken,
      refreshToken,
      nextStep: "Complete your profile with address, vehicle/shop, and payout details",
    });
  } catch (error) {
    console.error("❌ Verify OTP error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== STEP 3: COMPLETE PROFILE ====================
const completePartnerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profileData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid partner ID" });
    }

    const partner = await Partner.findById(id);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Add common profile data
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
        
        // ⭐ Process services with ObjectId generation
        if (profileData.services && Array.isArray(profileData.services)) {
          partner.services = profileData.services.map(service => ({
            _id: new mongoose.Types.ObjectId(),
            serviceImage: service.serviceImage || "",
            serviceName: service.serviceName,
            description: service.description || "",
            minPrice: parseFloat(service.minPrice),
            maxPrice: parseFloat(service.maxPrice)
          }));
        }
        
        if (profileData.yearsOfExperience) partner.yearsOfExperience = profileData.yearsOfExperience;
        if (profileData.specializations) partner.specializations = profileData.specializations;
        if (profileData.certifications) partner.certifications = profileData.certifications;
        if (profileData.profilePhoto) partner.profilePhoto = profileData.profilePhoto;
        if (profileData.idProof) partner.idProof = profileData.idProof;
        break;

      case "Product Seller":
        if (profileData.shopDetails) partner.shopDetails = profileData.shopDetails;
        
        // ⭐ Process products with ObjectId generation
        if (profileData.products && Array.isArray(profileData.products)) {
          partner.products = profileData.products.map(product => ({
            _id: new mongoose.Types.ObjectId(), // ⭐ Generate productId
            productImage: product.productImage || "",
            productTitle: product.productTitle,
            productDescription: product.productDescription || "",
            unitPrice: parseFloat(product.unitPrice),
            stockQuantity: parseInt(product.stockQuantity)
          }));
        }
        break;
    }

    // Payout details
    if (profileData.payoutDetails) partner.payoutDetails = profileData.payoutDetails;

    // Save profile
    await partner.save();

    console.log(`✅ Profile completed: ${partner.email} (${role})`);
    console.log(`⏳ Waiting for admin approval...`);

    // Build response
    const responseData = {
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
    };

    // ⭐ Add products with IDs for Product Sellers
    if (role === "Product Seller" && partner.products && partner.products.length > 0) {
      responseData.products = partner.products.map(product => ({
        productId: product._id.toString(),  // ⭐ Product ID
        sellerId: partner._id.toString(),    // ⭐ Seller ID
        productImage: product.productImage,
        productTitle: product.productTitle,
        productDescription: product.productDescription,
        unitPrice: product.unitPrice,
        stockQuantity: product.stockQuantity
      }));
      responseData.summary = {
        totalProducts: partner.products.length,
        sellerId: partner._id.toString(),
        sellerName: partner.fullName
      };
      responseData.note = "Products added successfully! You can login after admin approval.";
      console.log(`📦 ${partner.products.length} products added`);
    }

    // ⭐ Add services with IDs for Repair Technicians
    if (role === "Repair Service Technician" && partner.services && partner.services.length > 0) {
      responseData.services = partner.services.map(service => ({
        serviceId: service._id.toString(),     // ⭐ Service ID
        technicianId: partner._id.toString(),  // ⭐ Technician ID
        serviceImage: service.serviceImage,
        serviceName: service.serviceName,
        description: service.description,
        minPrice: service.minPrice,
        maxPrice: service.maxPrice
      }));
      responseData.summary = {
        totalServices: partner.services.length,
        technicianId: partner._id.toString(),
        technicianName: partner.fullName
      };
      console.log(`🔧 ${partner.services.length} services added`);
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("❌ Complete profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== LOGIN (EMAIL ONLY) ====================
const loginPartner = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const partner = await Partner.findOne({ email: email.toLowerCase() });

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (!partner.isVerified) {
      return res.status(403).json({ message: "Please verify your account first" });
    }

    // Check if admin approved
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

    // Generate tokens (accessToken & refreshToken only)
    const { accessToken, refreshToken } = await generateTokens(
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
    const authHeader = req.headers.authorization;
    const accessToken = authHeader && authHeader.split(' ')[1];
    const { refreshToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: "No token provided" });
    }

    // Blacklist tokens
    blacklistToken(accessToken, 24 * 60 * 60 * 1000);
    console.log(`🚫 Access token blacklisted`);

    if (refreshToken) {
      blacklistRefreshToken(refreshToken, 7 * 24 * 60 * 60 * 1000);
      console.log(`🚫 Refresh token blacklisted`);
    }

    if (req.partner) {
      console.log(`👋 Partner logged out: ${req.partner.email}`);
    }

    res.status(200).json({ message: "Logout successful ✅" });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== FORGOT PASSWORD - STEP 1: SEND OTP ====================
const forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({ message: "Email or phone number is required" });
    }

    const isEmail = emailOrPhone.includes("@");

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

    // Store in memory
    passwordResetStore[emailOrPhone] = {
      otp,
      partnerId: partner._id,
      verified: false,
      expiresAt: Date.now() + 10 * 60 * 1000,
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
          `,
        });
        console.log(`✅ Email sent to ${emailOrPhone}`);
      } else {
        const formattedPhone = formatPhoneNumber(emailOrPhone);
        await getTwilioClient().messages.create({
          body: `Your SparkleWash password reset OTP is: ${otp}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });
        console.log(`✅ SMS sent to ${formattedPhone}`);
      }

      return res.status(200).json({
        message: `OTP sent to your ${isEmail ? "email" : "phone number"} ✅`,
        sentTo: emailOrPhone,
      });
    } catch (sendError) {
      console.error(`❌ ${isEmail ? "Email" : "SMS"} error:`, sendError.message);

      if (process.env.NODE_ENV === "development") {
        return res.status(200).json({
          message: `⚠️ ${isEmail ? "Email" : "SMS"} failed. OTP shown for testing.`,
          sentTo: emailOrPhone,
          otp,
          error: sendError.message,
        });
      }

      return res.status(500).json({
        message: `Failed to send OTP`,
        error: sendError.message
      });
    }
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== FORGOT PASSWORD - STEP 2: VERIFY OTP ====================
const verifyResetOTP = async (req, res) => {
  try {
    const { emailOrPhone, otp } = req.body;

    if (!emailOrPhone || !otp) {
      return res.status(400).json({ message: "Email/Phone and OTP are required" });
    }

    const storedData = passwordResetStore[emailOrPhone];

    if (!storedData) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    if (storedData.expiresAt < Date.now()) {
      delete passwordResetStore[emailOrPhone];
      return res.status(400).json({ message: "OTP expired" });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Mark as verified
    passwordResetStore[emailOrPhone].verified = true;
    passwordResetStore[emailOrPhone].expiresAt = Date.now() + 5 * 60 * 1000;

    res.status(200).json({
      message: "OTP verified successfully ✅",
      emailOrPhone,
    });
  } catch (error) {
    console.error("❌ Verify reset OTP error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== FORGOT PASSWORD - STEP 3: RESET PASSWORD ====================
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
      return res.status(400).json({ message: "Session expired" });
    }

    if (!storedData.verified) {
      return res.status(400).json({ message: "Please verify OTP first" });
    }

    if (storedData.expiresAt < Date.now()) {
      delete passwordResetStore[emailOrPhone];
      return res.status(400).json({ message: "Session expired" });
    }

    const partner = await Partner.findById(storedData.partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Hash and save new password
    partner.password = await bcrypt.hash(newPassword, 10);
    await partner.save();

    // Clear data
    delete passwordResetStore[emailOrPhone];

    console.log(`✅ Password reset: ${emailOrPhone}`);

    res.status(200).json({ message: "Password reset successfully ✅" });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== GET ALL PARTNERS ====================
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

// ==================== GET PARTNER BY ID ====================
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

// ==================== UPDATE PARTNER ====================
const updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    delete updateData.password;
    delete updateData.role;

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

// ==================== DELETE PARTNER ====================
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

// ==================== TOGGLE PARTNER STATUS (ADMIN APPROVAL) ====================
const togglePartnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    console.log("\n🔄 ===== TOGGLE PARTNER STATUS =====");
    console.log("📥 Partner ID:", id);
    console.log("📥 New Status:", isActive);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ 
        message: "isActive must be a boolean"
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
  logoutPartner,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  getAllPartners,
  getPartnerById,
  updatePartner,
  deletePartner,
  togglePartnerStatus,
};