import mongoose from "mongoose";

// ---------------- PRODUCT SNAPSHOT ----------------
const productItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productImage: { type: String, required: true },
    productTitle: { type: String, required: true, trim: true },
    productDescription: { type: String, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, min: 0 },
    quantityOrdered: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

// ---------------- ADDRESS SCHEMA ----------------
const addressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    pincode: String,
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: [Number], // [longitude, latitude]
    },
    maxCars: Number,
  },
  { _id: false }
);

// ---------------- DELIVERY PARTNER SCHEMA ----------------
const deliveryPartnerSchema = new mongoose.Schema(
  {
    deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: "WasherEmployee" },
    name: { type: String, required: true },
    phone: { type: String },
    vehicle: {
      type: { type: String }, // e.g., "Toyota Prius"
      license: { type: String }, // e.g., "ABC-123"
    },
    estimatedDelivery: { type: Date },
  },
  { _id: false }
);

// ---------------- SELLER ORDER TRACK ----------------
const sellerOrderTrackSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    customerShoppingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerShopping",
      required: true,
    },

    // Customer details snapshot
    customer: {
      customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
      name: { type: String, required: true },
      phone: { type: String },
      address: addressSchema,
    },

    // Product list
    products: [productItemSchema],

    // Delivery partner info
    deliveryPartner: deliveryPartnerSchema,

    // Order & Delivery status
    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Packed",
        "Dispatched",
        "Delivering",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    estimatedDelivery: { type: Date },
    remarks: { type: String, default: "" },
    updatedBy: { type: String, default: "Seller" },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError during hot reload
export default mongoose.models.SellerOrderTrack ||
  mongoose.model("SellerOrderTrack", sellerOrderTrackSchema);
