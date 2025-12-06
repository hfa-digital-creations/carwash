import mongoose from "mongoose";

// Package Schema
const packageSchema = new mongoose.Schema({
  packageType: { type: String }, // "Basic Wash", "Standard Wash", "Premium Wash"
  services: [{ type: String }], // Array of services included
  price: { type: Number },
  expressEnabled: { type: Boolean, default: false }
}, { _id: false });

// Address Schema
const addressSchema = new mongoose.Schema({
  street: { type: String },
  unit: { type: String }, // Unit/Apt/Suite
  city: { type: String },
  pincode: { type: String },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  }
}, { _id: false });

// Status Timeline Schema
const statusTimelineSchema = new mongoose.Schema({
  status: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

// Main Booking Schema
const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    default: () => "#" + Math.floor(100000 + Math.random() * 900000)
  },
  
  // Customer Details
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String },
  customerPhone: { type: String },
  
  // Service Details
  serviceType: { type: String, required: true }, // "Car Wash" | "Bike Wash"
  vehicleType: { type: String, required: true }, // "Car" | "Bike"
  vehicleModel: { type: String },
  vehicleNumber: { type: String },
  
  // Package Details
  package: packageSchema,
  
  // Address
  address: addressSchema,
  
  // Schedule
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true }, // "10:00 AM"
  timeSlot: { type: String }, // "Morning" | "Afternoon" | "Evening"
  estimatedArrival: { type: String }, // "10 minutes", "15 minutes"
  
  // Partner Details (Assigned by Admin)
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner" },
  partnerName: { type: String },
  partnerPhone: { type: String },
  partnerPhoto: { type: String },
  partnerRating: { type: Number },
  
  // Status Tracking
  status: {
    type: String,
    enum: [
      "Pending", // Waiting for admin approval
      "Confirmed", // Admin approved, waiting for partner assignment
      "Partner Accepted", // Partner accepted the job
      "Partner Declined", // Partner declined
      "Washer On The Way",
      "Washer Arrived",
      "Washing in Progress",
      "Completed",
      "Cancelled"
    ],
    default: "Pending"
  },
  statusTimeline: [statusTimelineSchema],
  
  // Payment
  paymentMethod: {
    type: String,
    enum: ["UPI", "Debit Card", "Credit Card", "Net Banking", "Wallet Balance"],
    required: false
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending"
  },
  
  // Pricing
  subtotal: { type: Number, required: true },
  expressFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  couponCode: { type: String },
  total: { type: Number, required: true },
  advancePayment: { type: Number, default: 0 },
  advancePaid: { type: Boolean, default: false },
  
  // QR Code
  qrCode: { type: String }, // Base64 data URL
  
  // Additional
  specialInstructions: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
  
  // Cancellation
  cancellationReason: { type: String },
  cancelledBy: { type: String, enum: ["Customer", "Partner", "Admin"] },
  cancellationDate: { type: Date }
  
}, { timestamps: true });

// Create 2dsphere index for location-based queries
bookingSchema.index({ "address.location": "2dsphere" });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;