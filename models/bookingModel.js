import mongoose from "mongoose";

// Package Schema
const packageSchema = new mongoose.Schema({
  packageType: { type: String },
  services: [{ type: String }],
  price: { type: Number },
  expressEnabled: { type: Boolean, default: false }
}, { _id: false });

// ✅ Address Schema (WITHOUT location field)
const addressSchema = new mongoose.Schema({
  street: { type: String },
  unit: { type: String },
  city: { type: String },
  pincode: { type: String }
  // ❌ location field REMOVED
}, { _id: false });

// ✅ Live Location Schema (Separate)
const liveLocationSchema = new mongoose.Schema({
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  address: { type: String, default: null }
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
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  serviceType: { type: String, required: true },
  serviceName: { type: String },
  vehicleType: { type: String, required: true },
  // ❌ vehicleModel: REMOVED
  vehicleNumber: { type: String },
  
  // Package Details
  package: packageSchema,
  
  // ✅ Address (WITHOUT location field)
  address: addressSchema,
  
  // ✅ Live Location (GPS coordinates - separate field)
  liveLocation: liveLocationSchema,
  
  // Express Service
  expressService: { type: Boolean, default: false },
  
  // Schedule (Optional)
  scheduledDate: { type: Date, required: false },
  scheduledTime: { type: String, required: false },
  timeSlot: { type: String },
  estimatedArrival: { type: String },
  
  // Partner Details
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner" },
  partnerName: { type: String },
  partnerPhone: { type: String },
  partnerPhoto: { type: String },
  partnerRating: { type: Number },
  
  // Status Tracking
  status: {
    type: String,
    enum: [
      "Pending",
      "Confirmed",
      "Partner Accepted",
      "Partner Declined",
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
  balancePayment: { type: Number, default: 0 },
  advancePaid: { type: Boolean, default: false },
  transactionId: { type: String },
  balanceTransactionId: { type: String },
  balancePaymentMethod: { type: String },
  paymentGatewayResponse: { type: mongoose.Schema.Types.Mixed },
  
  // QR Code
  qrCode: { type: String },
  
  // Additional
  specialInstructions: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
  
  // Cancellation
  cancellationReason: { type: String },
  cancelledBy: { type: String, enum: ["Customer", "Partner", "Admin"] },
  cancellationDate: { type: Date }
  
}, { timestamps: true });

// ❌ REMOVED: 2dsphere index (no longer needed)
// bookingSchema.index({ "address.location": "2dsphere" });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;