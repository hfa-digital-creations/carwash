import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // Customer reference
    customerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    // Step 1: Vehicle info
    vehicleType: { 
      type: String, 
      enum: ["Car", "Bike"], 
      required: true 
    },
    vehicleNumber: { type: String, required: true },

    // Step 2: Embedded wash package details
    washPackage: {
      packageName: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String },
      features: [{ type: String }],
    },

    // Step 3: Service type
    serviceType: { 
      type: String, 
      enum: ["Normal", "Express"], 
      default: "Normal" 
    },

    // Step 4: Address
    address: {
      street: String,
      maxCars: Number,
      city: String,
      pincode: String,
      location: {
        type: { type: String, default: "Point" },
        coordinates: [Number], // [longitude, latitude]
      },
    },

    // Step 5: Date & Time
    bookingDate: { type: Date, required: true },
    bookingTime: { type: String, required: true },

    // Step 6: Extra summary details
    expressCharge: { type: Number, default: 0 }, // e.g. ₹10 for express
    advanceBookingCharge: { type: Number, default: 0 }, // e.g. ₹10 for advance
    totalAmount: { type: Number, required: true }, // e.g. ₹50 overall

    // Step 7: Coupon details
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },
    // Step 8: Payment
    paymentMethod: { 
      type: String, 
      enum: ["Cash", "UPI", "Card"], 
      required: true 
    },
    paymentStatus: { 
      type: String, 
      enum: ["Pending", "Completed", "Paid"], 
      default: "Pending" 
    },

    // Step 9: Booking status
    status: { 
      type: String, 
      enum: ["Pending", "Confirmed", "Declined", "On the Way", "Started", "Completed"], 
      default: "Pending" 
    },
    cancelReason: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
