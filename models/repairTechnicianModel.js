import mongoose from "mongoose";

// ===== Service details schema (embedded) =====
const serviceSchema = new mongoose.Schema({
  itemImage: { type: String, required: true },
  itemName: { type: String, required: true },
  subTitle: { type: String },
  description: { type: String, required: true },
  minPrice: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
}, { timestamps: true });

// ===== Payout details schema =====
const payoutSchema = new mongoose.Schema({
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  idProof: [{ type: String, required: true }],
  termsAccepted: { type: Boolean, default: false },
});

// ===== Shop details schema =====
const shopSchema = new mongoose.Schema({
  shopName: { type: String },
  shopType: { type: String },
  shopAddress: { type: String },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number] } // [longitude, latitude]
  },
  shopImages: [{ type: String }]
});

// ===== Main Repair Technician schema =====
const repairTechnicianSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ["Male", "Female", "Other"] },

  role: { type: String, enum: ["Repair Service Technician"], default: "Repair Service Technician" },

  shopDetails: shopSchema,
  services: [serviceSchema],
  yearsOfExperience: { type: Number },
  profilePhoto: { type: String },
  specializations: [{ type: String }],
  payoutDetails: payoutSchema,

  // Referral code
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null }, // optional

  isActive: { type: Boolean, default: false },
}, { timestamps: true });

// 🔥 Auto-generate referral code before saving
repairTechnicianSchema.pre("save", function (next) {
  if (!this.referralCode) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.referralCode = code;
  }
  next();
});

export default mongoose.model("RepairTechnician", repairTechnicianSchema);
