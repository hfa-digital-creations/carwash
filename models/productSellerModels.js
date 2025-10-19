    import mongoose from "mongoose";

    // Product details schema
    const productSchema = new mongoose.Schema({
    productImage: { type: String }, // multer file path
    productTitle: { type: String },
    productDescription: { type: String },
    unitPrice: { type: Number },
    stockQuantity: { type: Number },
    });

    // Payout / Bank details schema
    const payoutSchema = new mongoose.Schema({
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    idProof: [{ type: String, required: true }], // Aadhaar / Govt ID files
    termsAccepted: { type: Boolean, default: false },
    });

    // Shop details schema
    const shopSchema = new mongoose.Schema({
    shopName: { type: String },
    shopType: { type: String },
    shopAddress: { type: String },
    location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number] }, // [longitude, latitude]
    },
    shopImages: [{ type: String }], // multer file paths
    });

    // Main Product Seller model
    const productSellerSchema = new mongoose.Schema(
    {
        // Personal details
        fullName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        dateOfBirth: { type: Date },
        gender: { type: String, enum: ["Male", "Female", "Other"] },

        // Role
        role: { type: String, enum: ["Product Seller"], default: "Product Seller" },

        // Shop info
        shopDetails: shopSchema,

        // Products
        products: [productSchema],

        // Payout info
        payoutDetails: payoutSchema,

        // Admin control
        isActive: { type: Boolean, default: false }, // false by default, admin can activate
    },
    { timestamps: true }
    );

    export default mongoose.model("ProductSeller", productSellerSchema);
