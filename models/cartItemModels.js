import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  // Product items
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: { type: String },
  productDescription: { type: String },
  quantity: { type: Number, default: 1 },
  price: { type: Number },
  total: {
    type: Number,
    default: function () {
      return this.quantity * this.price;
    },
  },

  // Service items
  serviceItems: [
    {
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceItem", required: true },
      productImage: { type: String },
      productName: { type: String, required: true },
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
    items: [cartItemSchema], // array of items
    subtotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Middleware to calculate subtotal automatically
cartSchema.pre("save", function (next) {
  let total = 0;
  this.items.forEach((item) => {
    // For product items
    if (item.productId && item.total) total += item.total;
    // For service items
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
