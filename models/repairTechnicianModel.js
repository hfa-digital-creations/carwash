import mongoose from "mongoose";

// Service details schema
const serviceSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  minPrice: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
  certifications: [{ type: String }], // store file URLs or paths
});

// Bank / Payout details schema
const payoutSchema = new mongoose.Schema({
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  idProof: [{ type: String, required: true }], // Aadhaar/Pan/Voter ID files
  termsAccepted: { type: Boolean, default: false },
});

// Shop details schema
const shopSchema = new mongoose.Schema({
  shopName: { type: String },
  shopType: { type: String },
  shopAddress: { type: String },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number] } // [longitude, latitude]
  },
  shopImages: [{ type: String }] // file URLs/paths
});

// Main Repair Technician model
const repairTechnicianSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    role: { type: String, enum: ["Repair Service Technician"], default: "Repair Service Technician" },

    // Shop info
    shopDetails: shopSchema,

    // Services offered
    services: [serviceSchema],
    yearsOfExperience: { type: Number },
    profilePhoto: { type: String },
    idProof: [{ type: String }], // Aadhaar / Pan / Voter ID
    specializations: [{ type: String }], // uploaded certifications

    // Payout
    payoutDetails: payoutSchema,

    // Admin control
    isActive: { type: Boolean, default: false } // false by default, admin can activate
  },
  { timestamps: true }
);

export default mongoose.model("RepairTechnician", repairTechnicianSchema);
