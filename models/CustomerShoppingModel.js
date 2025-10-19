import mongoose from "mongoose";

// Cart item sub-schema
const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productTitle: { type: String, required: true },
    productDescription: { type: String },
    unitPrice: { type: Number, required: true },
    stockQuantity: { type: Number },
    productImage: { type: String },
    quantity: { type: Number, required: true },
    total: { type: Number, required: true } // unitPrice * quantity
  },
  { _id: false } // avoid creating extra _id for each cartItem
);

// Main order schema
const customerShoppingSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },

    // Snapshot of customer details at the time of order
    customerDetails: {
      name: { type: String },
      email: { type: String },
      phone: { type: String }
    },

    cartItems: [cartItemSchema],

    address: {
      street: String,
      city: String,
      pincode: String,
      maxCars: Number,
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: [Number]
      }
    },

    payment: {
      method: { type: String, required: true }, // e.g., "UPI", "COD"
      status: { type: String, default: "Pending" },
      transactionId: String,
      amount: Number // total amount of order
    },

    orderStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Delivered", "Cancelled"],
      default: "Pending"
    },

    cancelReason: String,
    cancelledAt: Date,
    subtotal: { type: Number, required: true } // sum of all cartItem totals
  },
  { timestamps: true }
);

export default mongoose.model("CustomerShopping", customerShoppingSchema);
