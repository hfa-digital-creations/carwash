import Customer from "../models/customerModels.js";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";

// Temporary stores
let registrationStore = {}; // for registration
let passwordResetStore = {}; // for forgot/reset password

// -------------------- STEP 1: Send OTP & Temporarily Store User Data --------------------
const sendRegistrationOTP = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword } = req.body;

    if (!fullName || !email || !phoneNumber || !password || !confirmPassword)
      return res.status(400).json({ message: "All fields are required" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const existing = await Customer.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const otp = otpGenerator.generate(4, { upperCaseAlphabets: false, specialChars: false });

    registrationStore[email] = {
      data: { fullName, email, phoneNumber, password },
      otp,
    };

    console.log("Registration OTP:", otp);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Car Wash Service" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP for Registration",
      text: `Hello ${fullName}, your OTP for registration is ${otp}.`,
    });

    res.status(200).json({ message: "OTP sent to email successfully ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- STEP 2: Verify OTP & Register User --------------------
const verifyOTPAndRegister = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) return res.status(400).json({ message: "OTP is required" });

    const email = Object.keys(registrationStore).find(key => registrationStore[key].otp === otp);
    if (!email) return res.status(400).json({ message: "Invalid or expired OTP" });

    const { fullName, phoneNumber, password } = registrationStore[email].data;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Customer({
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      password: hashedPassword,
    });

    await newUser.save();
    delete registrationStore[email];

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------- STEP 3: Forgot Password (Send OTP) --------------------
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

// -------------------- CRUD OPERATIONS --------------------

// Get all customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.status(200).json({ message: "All customers fetched", customers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get customer by ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.status(200).json({ message: "Customer fetched", customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const customer = await Customer.findByIdAndUpdate(id, updates, { new: true });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    res.status(200).json({ message: "Customer updated", customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  sendRegistrationOTP,
  verifyOTPAndRegister,
  forgotPassword,
  resetPassword,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
