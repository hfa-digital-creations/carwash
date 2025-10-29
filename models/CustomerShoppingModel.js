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
  { _id: false }
);

// Main order schema
const customerShoppingSchema = new mongoose.Schema(
  {
    // ✅ Unique shopping order ID
    shoppingOrderId: { type: String, unique: true },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

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
      amount: Number
    },

    orderStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Delivered", "Cancelled"],
      default: "Pending"
    },

    cancelReason: String,
    cancelledAt: Date,
    subtotal: { type: Number, required: true },

    // ✅ NEW DELIVERY PERSON FIELDS
    isDeliveryAccepted: { type: Boolean, default: false },
    deliveryPersonDetails: {
      deliveryPersonId: { type: mongoose.Schema.Types.ObjectId, ref: "WasherEmployee" },
      fullName: { type: String },
      phone: { type: String },
      avgRating: { type: Number },
      vehicleType: { type: String },
    },
    deliveryAcceptedAt: { type: Date },
    estimatedDeliveryTime: { type: Date },

    progress: [
      {
        status: { type: String },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ✅ Auto-generate unique shopping order ID
customerShoppingSchema.pre("save", async function (next) {
  if (!this.shoppingOrderId) {
    try {
      const lastOrder = await mongoose
        .model("CustomerShopping")
        .findOne({ shoppingOrderId: { $exists: true } })
        .sort({ createdAt: -1 });

      let lastNumber = 10000; // starting point

      if (lastOrder && lastOrder.shoppingOrderId) {
        const num = parseInt(lastOrder.shoppingOrderId.replace("#SHOP", ""));
        if (!isNaN(num)) lastNumber = num;
      }

      this.shoppingOrderId = `#SHOP${lastNumber + 1}`;
      next();
    } catch (err) {
      console.error("Error generating shoppingOrderId:", err);
      next(err);
    }
  } else {
    next();
  }
});

export default mongoose.model("CustomerShopping", customerShoppingSchema);
