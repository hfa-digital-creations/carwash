// ============================================
// FILE: models/otpModels.js
// ============================================
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  // Support both email and phone
  email: {
    type: String,
    lowercase: true,
    sparse: true,  // Allows null/undefined but unique when present
  },
  phoneNumber: {
    type: String,
    sparse: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["registration", "password-reset", "verification"],
    default: "registration",
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Custom validation: either email or phoneNumber must be present
otpSchema.pre('validate', function(next) {
  if (!this.email && !this.phoneNumber) {
    next(new Error('Either email or phoneNumber is required'));
  } else {
    next();
  }
});

// Indexes for faster queries
otpSchema.index({ email: 1, createdAt: -1 });
otpSchema.index({ phoneNumber: 1, createdAt: -1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;