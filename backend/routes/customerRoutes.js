import express from "express";
import CustomerControllers from "../controllers/CustomerControllers.js";

const router = express.Router();

// -------------------- OTP & Registration --------------------
router.post("/sendOTP", CustomerControllers.sendRegistrationOTP);       // Step 1: Send OTP
router.post("/registerUser", CustomerControllers.verifyOTPAndRegister); // Step 2: Verify OTP & register user

// -------------------- Password Reset --------------------
router.post("/forgotPassword", CustomerControllers.forgotPassword);     // Send OTP for password reset
router.post("/resetPassword", CustomerControllers.resetPassword);       // Reset password using OTP

// -------------------- CRUD OPERATIONS --------------------
router.get("/getAllCustomers", CustomerControllers.getAllCustomers);   // Get all customers
router.get("/getCustomerById/:id", CustomerControllers.getCustomerById);// Get single customer by ID
router.put("/updateCustomer/:id", CustomerControllers.updateCustomer);  // Update customer
router.delete("/deleteCustomer/:id", CustomerControllers.deleteCustomer);// Delete customer

export default router;
