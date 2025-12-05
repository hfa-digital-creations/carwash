import Customer from "../../models/customerModels.js";
import Address from "../../models/createAddressModels.js";
import OTP from "../../models/otpModels.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import twilio from "twilio";
import admin from "../../config/firebase.js";
import { generateTokens } from "../../middlewares/authMiddleware.js";

// -------------------- Twilio Setup (Lazy Initialization) --------------------
let twilioClient = null;

const getTwilioClient = () => {
  if (!twilioClient) {
    console.log("🔧 Initializing Twilio client...");
    console.log("  SID:", process.env.TWILIO_ACCOUNT_SID);
    console.log("  Phone:", process.env.TWILIO_PHONE_NUMBER);

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error("Twilio credentials not configured");
    }

    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
};

// -------------------- Nodemailer Setup (Lazy Initialization) --------------------
let transporter = null;

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

// -------------------- Helper: Format Phone Number --------------------
const formatPhoneNumber = (phone) => {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+91' + cleaned;
  }
  return cleaned;
};

// In-memory storage for registration data and password reset
const registrationStore = {};
const passwordResetStore = {};

// -------------------- STEP 1: Register User (Send OTP) --------------------
const registerUser = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword, referredBy } = req.body;

    // Validate required fields
    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if email already exists
    const existingEmail = await Customer.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check if phone number already exists
    const existingPhone = await Customer.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already exists" });
    }

    // Validate referral code if provided
    if (referredBy) {
      const referrer = await Customer.findOne({ referralCode: referredBy });
      if (!referrer) {
        return res.status(400).json({ message: "Invalid referral code" });
      }
    }

    // Generate random 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Save OTP in MongoDB (expires in 10 min)
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Store registration data temporarily
    registrationStore[phoneNumber] = {
      fullName,
      email: email.toLowerCase(),
      password,
      referredBy: referredBy || null,
      expiresAt: Date.now() + 15 * 60 * 1000,
    };

    console.log(`📝 Generated OTP for ${phoneNumber}: ${otp}`);
    console.log(`💾 Stored registration data for: ${phoneNumber}`);

    // Format phone number for Twilio
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`📞 Formatted phone: ${formattedPhone}`);

    // Send OTP via Twilio
    try {
      const message = await getTwilioClient().messages.create({
        body: `Your Car Wash registration OTP is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });

      console.log(`✅ OTP sent to ${formattedPhone}. SID: ${message.sid}`);

      return res.status(200).json({
        message: "OTP sent to your phone number ✅",
        phoneNumber: formattedPhone,
      });
    } catch (error) {
      console.error("❌ Twilio error:", error.message);

      if (process.env.NODE_ENV === "development") {
        return res.status(200).json({
          message: "⚠️ SMS failed. OTP shown for testing only.",
          phoneNumber: formattedPhone,
          otp,
          error: error.message,
        });
      } else {
        await OTP.deleteMany({ email: email.toLowerCase() });
        delete registrationStore[phoneNumber];
        return res.status(500).json({
          message: "Failed to send OTP. Please check your phone number and try again.",
          error: error.message
        });
      }
    }
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- STEP 2: Verify Registration OTP --------------------
const verifyRegistrationOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ message: "Phone number and OTP are required" });
    }

    console.log(`🔍 Verifying OTP for phone: ${phoneNumber}`);

    // Check if registration data exists
    const registrationData = registrationStore[phoneNumber];
    if (!registrationData) {
      return res.status(400).json({
        message: "Registration session not found. Please register again.",
        hint: "You must call /registerUser first to get OTP"
      });
    }

    // Check if registration data has expired
    if (registrationData.expiresAt < Date.now()) {
      delete registrationStore[phoneNumber];
      await OTP.deleteMany({ email: registrationData.email });
      return res.status(400).json({
        message: "Registration session expired. Please register again."
      });
    }

    // Find the most recent OTP by email
    const otpRecord = await OTP.findOne({
      email: registrationData.email,
      isUsed: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        message: "OTP not found or expired. Please request a new OTP.",
        hint: "Call /registerUser again to get a new OTP"
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    console.log(`✅ OTP verified for ${phoneNumber}`);

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Check if user already exists
    const existingUser = await Customer.findOne({
      $or: [
        { email: registrationData.email },
        { phoneNumber }
      ]
    });

    if (existingUser) {
      await OTP.deleteMany({ email: registrationData.email });
      delete registrationStore[phoneNumber];
      return res.status(400).json({
        message: "User already exists. Please login instead."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);

    // Create new user
    const newUser = await Customer.create({
      fullName: registrationData.fullName,
      email: registrationData.email,
      phoneNumber,
      password: hashedPassword,
      referredBy: registrationData.referredBy,
      isActive: true,
    });

    // Generate JWT tokens (accessToken & refreshToken only)
    const { accessToken, refreshToken } = await generateTokens(newUser._id, {
      email: newUser.email,
      phoneNumber: newUser.phoneNumber,
    });

    // Also create/update Firebase user (optional but recommended)
    try {
      await admin.auth().createUser({
        uid: newUser._id.toString(),
        email: newUser.email,
        phoneNumber: formatPhoneNumber(phoneNumber),
        displayName: newUser.fullName,
      });
      console.log(`✅ Firebase user created: ${newUser._id}`);
    } catch (firebaseError) {
      if (firebaseError.code === 'auth/uid-already-exists') {
        await admin.auth().updateUser(newUser._id.toString(), {
          email: newUser.email,
          displayName: newUser.fullName,
        });
        console.log(`✅ Firebase user updated: ${newUser._id}`);
      } else {
        console.warn(`⚠️ Firebase user creation warning:`, firebaseError.message);
      }
    }

    // Clean up
    await OTP.deleteMany({ email: registrationData.email });
    delete registrationStore[phoneNumber];

    console.log(`✅ User registered successfully: ${newUser.email}`);

    return res.status(201).json({
      message: "User registered successfully ✅",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        referralCode: newUser.referralCode,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("❌ Verify OTP error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Login User --------------------
const loginUser = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: "Email/Phone and password are required" });
    }

    // Find user
    const user = await Customer.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase() },
        { phoneNumber: emailOrPhone }
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Please verify your account first" });
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Generate JWT tokens (accessToken & refreshToken only)
    const { accessToken, refreshToken } = await generateTokens(user._id, {
      email: user.email,
      phoneNumber: user.phoneNumber,
    });

    res.status(200).json({
      message: "Login successful ✅",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        referralCode: user.referralCode,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- FORGOT PASSWORD STEP 1: Send OTP --------------------
const forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({ message: "Email or phone number is required" });
    }

    const isEmail = emailOrPhone.includes("@");

    const user = await Customer.findOne(
      isEmail
        ? { email: emailOrPhone.toLowerCase() }
        : { phoneNumber: emailOrPhone }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    passwordResetStore[emailOrPhone] = {
      otp,
      verified: false,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    console.log(`📝 Generated password reset OTP for ${emailOrPhone}: ${otp}`);

    try {
      if (isEmail) {
        await getTransporter().sendMail({
          from: `"Car Wash Service" <${process.env.EMAIL_USER}>`,
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
        const message = await getTwilioClient().messages.create({
          body: `Your Car Wash password reset OTP is: ${otp}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedPhone,
        });
        console.log(`✅ SMS OTP sent! SID: ${message.sid}`);
      }

      return res.status(200).json({
        message: `OTP sent to your ${isEmail ? "email" : "phone number"} ✅`,
        sentTo: emailOrPhone,
      });
    } catch (sendError) {
      console.error(`❌ ${isEmail ? "Email" : "SMS"} Error:`, sendError.message);

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

// -------------------- FORGOT PASSWORD STEP 2: Verify OTP --------------------
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

// -------------------- FORGOT PASSWORD STEP 3: Reset Password --------------------
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

    const isEmail = emailOrPhone.includes("@");
    const user = await Customer.findOne(
      isEmail
        ? { email: emailOrPhone.toLowerCase() }
        : { phoneNumber: emailOrPhone }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    delete passwordResetStore[emailOrPhone];

    console.log(`✅ Password reset successful for ${emailOrPhone}`);

    res.status(200).json({ message: "Password reset successfully ✅" });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get All Users --------------------
const getAllUsers = async (req, res) => {
  try {
    const users = await Customer.find().select("-password").lean();

    const usersWithAddress = await Promise.all(
      users.map(async (user) => {
        const address = await Address.findOne({ userId: user._id });
        return {
          ...user,
          address: address || null,
        };
      })
    );

    res.status(200).json({
      message: "Users fetched successfully ✅",
      count: usersWithAddress.length,
      users: usersWithAddress,
    });
  } catch (error) {
    console.error("❌ Get all users error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get User By ID --------------------
const getUserById = async (req, res) => {
  try {
    const user = await Customer.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const address = await Address.findOne({ userId: user._id });

    res.status(200).json({
      user: {
        ...user.toObject(),
        address: address || null
      }
    });
  } catch (error) {
    console.error("❌ Get user by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Update Profile --------------------
const updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { fullName, email, phoneNumber, street, city, pincode, maxCars, location } = req.body;

    if (email) {
      const existingEmailUser = await Customer.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId },
      });
      if (existingEmailUser) {
        return res.status(400).json({
          message: "Email already in use by another user"
        });
      }
    }

    const user = await Customer.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.fullName = fullName ?? user.fullName;
    if (email) user.email = email.toLowerCase();
    user.phoneNumber = phoneNumber ?? user.phoneNumber;
    await user.save();

    // Update Firebase user if email or name changed
    try {
      await admin.auth().updateUser(userId, {
        email: user.email,
        displayName: user.fullName,
      });
    } catch (firebaseError) {
      console.warn("⚠️ Could not update Firebase user:", firebaseError.message);
    }

    let address = await Address.findOne({ userId });
    if (address) {
      address.street = street ?? address.street;
      address.city = city ?? address.city;
      address.pincode = pincode ?? address.pincode;
      address.maxCars = maxCars ?? address.maxCars;
      address.location = location ?? address.location;
      await address.save();
    } else if (street || city || pincode) {
      address = await Address.create({
        userId,
        street,
        city,
        pincode,
        maxCars,
        location,
      });
    }

    res.status(200).json({
      message: "Profile updated successfully ✅",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        referralCode: user.referralCode,
      },
      address,
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Delete User --------------------
const deleteUser = async (req, res) => {
  try {
    const user = await Customer.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete from Firebase
    try {
      await admin.auth().deleteUser(req.params.id);
      console.log(`✅ Firebase user deleted: ${req.params.id}`);
    } catch (firebaseError) {
      console.warn("⚠️ Could not delete Firebase user:", firebaseError.message);
    }

    await Address.deleteMany({ userId: req.params.id });

    res.status(200).json({ message: "User deleted successfully ✅" });
  } catch (error) {
    console.error("❌ Delete user error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  registerUser,
  verifyRegistrationOTP,
  loginUser,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  getAllUsers,
  getUserById,
  updateProfile,
  deleteUser,
};