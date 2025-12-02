import mongoose from "mongoose";

// ===== Service Schema (for Repair Technician) =====
const serviceSchema = new mongoose.Schema({
  serviceImage: { type: String }, // Service image upload
  serviceName: { type: String }, // e.g., "Dry Cleaning"
  description: { type: String }, // Service description
  minPrice: { type: Number }, // Minimum price
  maxPrice: { type: Number }, // Maximum price
}, { _id: false });

// ===== Product Schema (for Product Seller) =====
const productSchema = new mongoose.Schema({
  productImage: { type: String }, // Product image upload
  productTitle: { type: String }, // Product name
  productDescription: { type: String }, // Product description
  unitPrice: { type: Number }, // Unit price in Rs
  stockQuantity: { type: Number }, // Stock quantity
}, { _id: false });

// ===== Shop Details Schema =====
const shopSchema = new mongoose.Schema({
  shopName: { type: String }, // Shop name
  shopType: { type: String }, // e.g., "Auto Repair", "Parts Store"
  shopAddress: { type: String }, // Full shop address
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  shopImages: [{ type: String }] // Multiple shop images upload
}, { _id: false });

// ===== Vehicle Details Schema =====
const vehicleSchema = new mongoose.Schema({
  vehicleType: { type: String }, // Bike, Car, etc.
  vehicleModel: { type: String }, // Honda Activa, etc.
  licensePlate: { type: String }, // TN01AB1234
  registrationCertificate: { type: String }, // RC file upload
  drivingLicense: { type: String }, // DL file upload
  documentVerified: { type: Boolean, default: false }
}, { _id: false });

// ===== Bank/Payout Details Schema =====
const payoutSchema = new mongoose.Schema({
  accountHolderName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
  idProof: { type: String }, // Aadhaar/Govt ID file upload
  termsAccepted: { type: Boolean, default: false }
}, { _id: false });

// ===== Address Schema =====
const addressSchema = new mongoose.Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
  country: { type: String },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  }
}, { _id: false });

// ===== Emergency Contact Schema =====
const emergencyContactSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String }
}, { _id: false });

// ===== MAIN PARTNER MODEL =====
const partnerSchema = new mongoose.Schema({
  // ========== STEP 1: Basic Info (Common for all) ==========
  fullName: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  
  // ========== STEP 2: Role Selection ==========
  role: { 
    type: String, 
    required: true,
    enum: ["Washing Personnel", "Delivery Person", "Repair Service Technician", "Product Seller"]
  },
  serviceCategories: [{ type: String }], // For Washing Personnel only
  
  // ========== STEP 3: Address & Emergency Contact ==========
  address: addressSchema,
  emergencyContact: emergencyContactSchema,
  
  // ========== STEP 4: Role-Specific Details ==========
  
  // Common: Profile Photo (All roles can have)
  profilePhoto: { type: String }, // Profile photo upload
  
  // For Delivery Person & Washing Personnel
  vehicleDetails: vehicleSchema,
  
  // For Repair Service Technician ONLY
  shopDetails: shopSchema, // Shop name, type, address, images
  services: [serviceSchema], // Multiple services with images, prices
  yearsOfExperience: { type: Number }, // Years of experience
  specializations: [{ type: String }], // Specializations/Certifications (text array)
  certifications: [{ type: String }], // Certification documents upload (file paths)
  idProof: { type: String }, // ID Proof / Aadhaar/Voter ID file
  
  // For Product Seller ONLY
  // shopDetails: shopSchema, // Same as above (reused)
  products: [productSchema], // Multiple products with images, prices, stock
  
  // ========== STEP 5: Payout Details (All roles) ==========
  payoutDetails: payoutSchema,
  
  // ========== Referral System ==========
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  
  // ========== Status & Ratings ==========
  isActive: { type: Boolean, default: false }, // Admin approval required
  isVerified: { type: Boolean, default: false }, // OTP verified
  avgRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  
}, { timestamps: true });

// ===== Auto-generate Referral Code =====
partnerSchema.pre("save", function (next) {
  if (!this.referralCode) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.referralCode = code;
  }
  next();
});

// ===== Create 2dsphere index for GPS =====
partnerSchema.index({ "address.location": "2dsphere" });
partnerSchema.index({ "shopDetails.location": "2dsphere" });

const Partner = mongoose.model("Partner", partnerSchema);
export default Partner;