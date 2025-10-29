import mongoose from "mongoose";

const washerEmployeeSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  serviceCategories: [{ type: String }],
  role: { 
    type: String, 
    enum: ["Washing Personnel", "Delivery Person", "Repair Service Technician", "Product Seller"], 
    required: true 
  },

  address: {
    street: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
    location: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number], default: [0, 0] } }
  },
  emergencyContact: { name: { type: String, required: true }, phone: { type: String, required: true } },

  vehicle: {
    type: { type: String },
    model: { type: String },
    licensePlate: { type: String },
    registrationCertificate: { type: String },
    drivingLicense: { type: String },
    documentVerified: { type: Boolean, default: false }
  },

  bankDetails: {
    accountHolderName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    aadhaarCard: { type: String }
  },

  termsAccepted: { type: Boolean, default: false },
  avgRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },

  // Referral code auto-generation
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },

  isActive: { type: Boolean, default: false }
}, { timestamps: true });

// Auto-generate referral code before saving
washerEmployeeSchema.pre("save", function (next) {
  if (!this.referralCode) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    this.referralCode = code;
  }
  next();
});

// Create 2dsphere index for GPS
washerEmployeeSchema.index({ "address.location": "2dsphere" });

export default mongoose.model("WasherEmployee", washerEmployeeSchema);
