import mongoose from "mongoose";

// Voucher Schema
const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  title: { type: String, required: true },
  description: { type: String },
  
  // Discount Details
  discountType: {
    type: String,
    enum: ["Percentage", "Fixed"],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscount: { type: Number }, // For percentage discounts
  
  // Applicable For
  applicableFor: [{
    type: String,
    enum: ["Car Wash", "Bike Wash", "Shopping", "Repair Services", "All"]
  }],
  
  // Validity
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  
  // Usage Limits
  minOrderValue: { type: Number, default: 0 },
  maxUsagePerUser: { type: Number, default: 1 },
  totalUsageLimit: { type: Number }, // Total times this voucher can be used
  usedCount: { type: Number, default: 0 },
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Additional
  termsAndConditions: { type: String },
  imageUrl: { type: String }
  
}, { timestamps: true });

// Voucher Usage Schema (Track who used which voucher)
const voucherUsageSchema = new mongoose.Schema({
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher", required: true },
  voucherCode: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: String, required: true },
  orderType: {
    type: String,
    enum: ["Booking", "ProductOrder", "ServiceBooking"],
    required: true
  },
  discountApplied: { type: Number, required: true },
  usedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes
voucherSchema.index({ code: 1 });
voucherSchema.index({ validFrom: 1, validUntil: 1 });
voucherUsageSchema.index({ userId: 1, voucherId: 1 });

const Voucher = mongoose.model("Voucher", voucherSchema);
const VoucherUsage = mongoose.model("VoucherUsage", voucherUsageSchema);

export { Voucher, VoucherUsage };