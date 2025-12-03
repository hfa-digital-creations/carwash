import mongoose from "mongoose";

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    default: () => "TXN" + Date.now() + Math.floor(Math.random() * 1000)
  },
  
  // Partner Details
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
  partnerName: { type: String },
  
  // Order/Booking Reference
  orderId: { type: String, required: true },
  orderType: {
    type: String,
    enum: ["Booking", "ProductOrder", "ServiceBooking"],
    required: true
  },
  
  // Customer Details
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  customerName: { type: String },
  
  // Item Details
  itemName: { type: String }, // Service name or product name
  itemImage: { type: String },
  
  // Transaction Details
  transactionType: {
    type: String,
    enum: ["Earning", "Payout", "Deduction", "Refund"],
    required: true
  },
  
  // Amount Breakdown
  amount: { type: Number, required: true }, // Gross amount
  commission: { type: Number, default: 0 }, // Platform commission
  serviceFee: { type: Number, default: 0 }, // Additional fees
  netAmount: { type: Number, required: true }, // Amount credited to partner
  
  // Status
  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed", "Refunded"],
    default: "Pending"
  },
  
  // Payment Details
  paymentMethod: { type: String },
  completedAt: { type: Date },
  
  // Location (for analytics)
  location: {
    city: { type: String },
    area: { type: String }
  }
  
}, { timestamps: true });

// Earnings Summary Schema (One per Partner)
const earningsSummarySchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Partner",
    required: true,
    unique: true
  },
  
  // Current Balance
  currentBalance: { type: Number, default: 0 },
  
  // This Week
  thisWeek: {
    earnings: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 }
  },
  
  // This Month
  thisMonth: {
    earnings: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 }
  },
  
  // All Time
  totalEarnings: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  
  // Payouts
  totalPayouts: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  lastPayoutDate: { type: Date },
  
  // Earnings by Type
  earningsByType: {
    "Car Wash": { type: Number, default: 0 },
    "Bike Wash": { type: Number, default: 0 },
    "Shopping": { type: Number, default: 0 },
    "Repair Services": { type: Number, default: 0 }
  }
  
}, { timestamps: true });

// Indexes
transactionSchema.index({ partnerId: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1 });
earningsSummarySchema.index({ partnerId: 1 }, { unique: true });

const Transaction = mongoose.model("Transaction", transactionSchema);
const EarningsSummary = mongoose.model("EarningsSummary", earningsSummarySchema);

export { Transaction, EarningsSummary };