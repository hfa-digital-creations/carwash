import mongoose from "mongoose";

const washerEmployeeSchema = new mongoose.Schema({
  // ===== Step 1: Personal Information =====
  fullName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  referralCode: { type: String },
  serviceCategories: [{ type: String }], // e.g., ["Washing", "Repair"]

  // ===== Step 2: Role Selection =====
  role: { 
    type: String, 
    enum: ["Washing Personnel", "Delivery Person", "Repair Service Technician", "Product Seller"], 
    required: true 
  },

  // ===== Step 3: Address & Emergency Contact =====
  address: {
    street: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    }
  },
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true }
  },

  // ===== Step 4: Vehicle Details =====
  vehicle: {
    type: { type: String }, // e.g., "Bike", "Car"
    model: { type: String },
    licensePlate: { type: String },
    registrationCertificate: { type: String }, // file path or URL
    drivingLicense: { type: String }, // file path or URL
    documentVerified: { type: Boolean, default: false }
  },

  // ===== Step 5: Bank & Payout Details =====
  bankDetails: {
    accountHolderName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    aadhaarCard: { type: String } // file path or URL
  },
  termsAccepted: { type: Boolean, default: false }

}, { timestamps: true });

// Create 2dsphere index for GPS queries
washerEmployeeSchema.index({ "address.location": "2dsphere" });

export default mongoose.model("WasherEmployee", washerEmployeeSchema);
