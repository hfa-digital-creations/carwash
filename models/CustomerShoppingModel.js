import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: { type: String, required: true },
  productDescription: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  total: {
    type: Number,
    required: true,
    default: function () {
      return this.quantity * this.price; // calculates automatically
    },
  },
});

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  maxCars: { type: Number, default: 1 },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function (v) {
          return v.length === 2;
        },
        message: "Coordinates must be an array of [longitude, latitude]",
      },
    },
  },
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["COD", "CreditCard", "DebitCard", "UPI", "NetBanking"],
    required: true,
  },
  transactionId: { type: String, default: null },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
});

const customerShoppingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    cartItems: {
      type: [cartItemSchema],
      validate: [arr => arr.length > 0, "Cart cannot be empty"],
      required: true,
    },
    address: { type: addressSchema, required: true },
    payment: { type: paymentSchema, required: true },
    orderStatus: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Processing",
    },
  },
  { timestamps: true }
);

// Geospatial index for queries
customerShoppingSchema.index({ "address.location": "2dsphere" });

export default mongoose.model("CustomerShopping", customerShoppingSchema);
