import Customer from "../models/customerModels.js";
import Address from "../models/createAddressModels.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
// -------------------- Register User --------------------

const registerUser = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword } = req.body;

    if (!fullName || !email || !phoneNumber || !password || !confirmPassword)
      return res.status(400).json({ message: "All fields are required" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const existingEmail = await Customer.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: "Email already exists" });

    const existingPhone = await Customer.findOne({ phoneNumber });
    if (existingPhone) return res.status(400).json({ message: "Phone number already exists" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

    const newUser = new Customer({
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      password: hashedPassword, // store hashed password
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully ✅", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// -------------------- Login User --------------------


const loginUser = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password)
      return res.status(400).json({ message: "Email/Phone and password are required" });

    const user = await Customer.findOne({
      $or: [{ email: emailOrPhone.toLowerCase() }, { phoneNumber: emailOrPhone }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect)
      return res.status(400).json({ message: "Incorrect password" }); // <-- this shows if password is wrong

    res.status(200).json({ message: "Login successful ✅", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await Customer.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false });
    passwordResetStore[email] = { otp };

    console.log("Forgot Password OTP:", otp);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Car Wash Service" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for Password Reset",
      text: `Hello, your OTP for password reset is ${otp}.`,
    });

    res.status(200).json({ message: "OTP sent to email successfully ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- STEP 4: Reset Password Using OTP --------------------
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword)
      return res.status(400).json({ message: "All fields are required" });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const storedData = passwordResetStore[email];
    if (!storedData || storedData.otp !== otp)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const user = await Customer.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    delete passwordResetStore[email];

    res.status(200).json({ message: "Password reset successfully ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- Get All Users --------------------
const getAllUsers = async (req, res) => {
  try {
    const users = await Customer.find();
    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get User By ID --------------------
const getUserById = async (req, res) => {
  try {
    const user = await Customer.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Update User --------------------
const updateProfile = async (req, res) => {
  try {
    const userId = req.params.id; // get from path
    const { fullName, email, phoneNumber, street, city, pincode, maxCars, location } = req.body;

    // 0️⃣ Check for duplicate email ONLY
    if (email) {
      const existingEmailUser = await Customer.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId }, // exclude current user
      });
      if (existingEmailUser) {
        return res.status(400).json({ message: "Email already in use by another user" });
      }
    }

    // 1️⃣ Update Customer info
    const user = await Customer.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.fullName = fullName ?? user.fullName;
    if (email) user.email = email.toLowerCase();
    user.phoneNumber = phoneNumber ?? user.phoneNumber; // no duplicate check, just update
    await user.save();

    // 2️⃣ Update or Create Address
    let address = await Address.findOne({ userId });
    if (address) {
      address.street = street ?? address.street;
      address.city = city ?? address.city;
      address.pincode = pincode ?? address.pincode;
      address.maxCars = maxCars ?? address.maxCars;
      address.location = location ?? address.location;
      await address.save();
    } else {
      address = await Address.create({
        userId,
        street,
        city,
        pincode,
        maxCars,
        location,
      });
    }

    res.status(200).json({ message: "Profile updated successfully", user, address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// -------------------- Delete User --------------------
const deleteUser = async (req, res) => {
  try {
    const user = await Customer.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getUserById,
  updateProfile,
  deleteUser,
};
