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
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ["Male", "Female", "Other"] },

  role: { type: String, enum: ["Repair Service Technician"], default: "Repair Service Technician" },

  shopDetails: shopSchema,

  services: [serviceSchema], // embedded services

  yearsOfExperience: { type: Number },
  profilePhoto: { type: String },
  specializations: [{ type: String }],

  payoutDetails: payoutSchema,

  isActive: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("RepairTechnician", repairTechnicianSchema);
