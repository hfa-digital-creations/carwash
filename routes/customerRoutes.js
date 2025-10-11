import express from "express";
import CustomerControllers from "../controllers/CustomerControllers.js";

const router = express.Router();

// Register user directly (no OTP)
router.post("/registerUser", CustomerControllers.registerUser);

export default router;
