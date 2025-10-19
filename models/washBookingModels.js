import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // 🔹 Customer reference
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔹 Vehicle info
    vehicleType: {
      type: String,
      enum: ["Car", "Bike"],
      required: true,
    },
    vehicleNumber: { type: String, required: true },

    // 🔹 Wash Package details
    washPackage: {
      packageName: { type: String, required: true },
      price: { type: Number, required: true },
      description: String,
      features: [String],
    },

    // 🔹 Service Type
    serviceType: {
      type: String,
      enum: ["Normal", "Express"],
      default: "Normal",
    },

    // 🔹 Address
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

    // 🔹 Booking Date & Time
    bookingDate: {
      type: Date,
      required: function () {
        return this.serviceType === "Normal";
      },
      default: null,
    },
    bookingTime: {
      type: String,
      required: function () {
        return this.serviceType === "Normal";
      },
      default: null,
    },

    // 🔹 Charges & Totals
    expressCharge: { type: Number, default: 0 },
    advanceBookingCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    // 🔹 Coupon details
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },

    // 🔹 Payment details
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Paid"],
      default: "Pending",
    },

    // 🔹 Washer Details (new added)
    washerDetails: {
  washerId: { type: mongoose.Schema.Types.ObjectId, ref: "WasherEmployee" },
  fullName: { type: String },
  phone: { type: String },
  avgRating: { type: Number, default: 0 }
},

isWasherAccepted: { 
  type: Boolean, 
  default: false 
}, 
    // 🔹 Wash Progress Tracking (new added)
    progress: [
      {
        stage: {
          type: String,
          enum: [
            "Confirmed",
            "On The Way",
            "Arrived",
            "Washing In Progress",
            "Completed",
          ],
        },
        time: String,
        status: { type: Boolean, default: false },
      },
    ],

    // 🔹 Estimated arrival
    estimatedArrival: { type: String, default: null },

    // 🔹 Booking status
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Declined",
        "On The Way",
        "Started",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },
    cancelReason: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
