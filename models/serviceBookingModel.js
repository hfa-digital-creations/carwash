import mongoose from "mongoose";

// Service Schema
const serviceSchema = new mongoose.Schema({
  serviceImage: { type: String },
  serviceName: { type: String, required: true },
  description: { type: String },
  estimatedPrice: { type: Number }
}, { _id: false });

// Address Schema
const addressSchema = new mongoose.Schema({
  street: { type: String },
  unit: { type: String },
  city: { type: String },
  pincode: { type: String },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  }
}, { _id: false });

// Shop Location Schema
const shopLocationSchema = new mongoose.Schema({
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: { type: [Number], default: [0, 0] }
}, { _id: false });

// Status Timeline Schema
const statusTimelineSchema = new mongoose.Schema({
  status: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

// Service Booking Schema
const serviceBookingSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true,
    default: () => "SRV" + Math.floor(100000 + Math.random() * 900000)
  },
  
  // Customer Details
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String },
  customerPhone: { type: String },
  
  // Service Details
  service: serviceSchema,
  
  // Technician Details (Customer selects or Admin assigns)
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
  technicianName: { type: String },
  technicianPhone: { type: String },
  technicianPhoto: { type: String },
  technicianRating: { type: Number },
  
  // Service Location
  isAtShop: { type: Boolean, required: true }, // true = at shop, false = at customer location
  shopName: { type: String }, // If at shop
  shopAddress: { type: String }, // If at shop
  shopLocation: shopLocationSchema, // If at shop
  serviceAddress: addressSchema, // If at customer location
  
  // Schedule
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  timeSlot: { type: String }, // "Morning" | "Afternoon" | "Evening"
  
  // Status Tracking
  status: {
    type: String,
    enum: [
      "Request Placed", // Customer sent request
      "Technician Assigned", // Admin assigned technician
      "Service Accepted", // Technician accepted
      "Technician Declined", // Technician declined
      "Service Ongoing", // Service in progress
      "Service Completed", // Service done
      "Cancelled"
    ],
    default: "Request Placed"
  },
  statusTimeline: [statusTimelineSchema],
  
  // Service Execution
  startedAt: { type: Date },
  completedAt: { type: Date },
  duration: { type: String }, // "2 hours 30 minutes"
  
  // Photos
  beforePhotos: [{ type: String }], // Array of image URLs
  afterPhotos: [{ type: String }], // Array of image URLs
  
  // Payment
  paymentMethod: {
    type: String,
    enum: ["UPI", "Debit Card", "Credit Card", "Net Banking", "Wallet Balance", "Cash"],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Pending"
  },
  
  // Pricing
  estimatedTotal: { type: Number },
  actualTotal: { type: Number }, // Final price after inspection
  advancePayment: { type: Number, default: 0 },
  
  // Notes
  customerNotes: { type: String },
  technicianNotes: { type: String },
  
  // Rating & Review
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
  
  // Cancellation
  cancellationReason: { type: String },
  cancelledBy: { type: String, enum: ["Customer", "Technician", "Admin"] },
  cancellationDate: { type: Date }
  
}, { timestamps: true });

// Create indexes
serviceBookingSchema.index({ technicianId: 1 });
serviceBookingSchema.index({ "serviceAddress.location": "2dsphere" });
serviceBookingSchema.index({ "shopLocation": "2dsphere" });

const ServiceBooking = mongoose.model("ServiceBooking", serviceBookingSchema);
export default ServiceBooking;