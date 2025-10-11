import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["PERCENTAGE", "CASHBACK", "FLAT"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    displayValue: {
      type: String,
      required: true, // e.g., "20%", "₹100", "₹50"
    },
    status: {
      type: String,
      enum: ["ACTIVE", "USED", "EXPIRED"],
      default: "ACTIVE",
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usedDate: {
      type: Date,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// 🔹 Indexes for faster queries
voucherSchema.index({ userId: 1, status: 1 });
voucherSchema.index({ code: 1 });
voucherSchema.index({ expiryDate: 1 });

// 🔹 Virtual for checking if voucher is expired
voucherSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiryDate && this.status !== "USED";
});

// 🔹 Method to check if voucher can be used
voucherSchema.methods.canBeUsed = function () {
  const now = new Date();
  return this.status === "ACTIVE" && now <= this.expiryDate;
};

// 🔹 Method to mark voucher as used
voucherSchema.methods.markAsUsed = function () {
  this.status = "USED";
  this.usedDate = new Date();
  return this.save();
};

// 🔹 Static method to update expired vouchers
voucherSchema.statics.updateExpiredVouchers = async function () {
  const now = new Date();
  return this.updateMany(
    { expiryDate: { $lt: now }, status: "ACTIVE" },
    { status: "EXPIRED" }
  );
};

// 🔹 Pre-save hook to auto-expire if needed
voucherSchema.pre("save", function (next) {
  if (this.status === "ACTIVE" && new Date() > this.expiryDate) {
    this.status = "EXPIRED";
  }
  next();
});

export default mongoose.model("Voucher", voucherSchema);
