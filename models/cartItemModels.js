import mongoose from "mongoose";

// Cart Item Schema
const cartItemSchema = new mongoose.Schema({
  // Product items
  product: {
    type: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      productTitle: String,
      productDescription: String,
      unitPrice: Number,
      stockQuantity: Number,
      productImage: String,
      sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductSeller" },
    },
    required: function () {
      return !this.serviceItems || this.serviceItems.length === 0;
    },
  },
  quantity: { type: Number, default: 1 },
  total: {
    type: Number,
    default: function () {
      return this.quantity * (this.product?.unitPrice || 0);
    },
  },

  // Service items
  serviceItems: [
    {
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceItem", required: true },
      serviceTitle: { type: String, required: true },
      description: { type: String },
      serviceCharges: { type: Number, required: true },
      serviceStore: {
        storeName: { type: String, required: true },
        storeAddress: { type: String, required: true },
        contactNumber: { type: String },
      },
    },
  ],
});

// Cart Schema
const cartSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [cartItemSchema],
    subtotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Middleware to calculate subtotal automatically
cartSchema.pre("save", function (next) {
  let total = 0;
  this.items.forEach((item) => {
    // Product total
    if (item.product && item.quantity) total += item.quantity * item.product.unitPrice;

    // Service total
    if (item.serviceItems && item.serviceItems.length > 0) {
      item.serviceItems.forEach((s) => {
        total += s.serviceCharges;
      });
    }
  });
  this.subtotal = total;
  next();
});

export default mongoose.model("Cart", cartSchema);
