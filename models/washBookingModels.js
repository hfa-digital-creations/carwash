import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    vehicleType: {
      type: String,
      enum: ["Car", "Bike"],
      required: true,
    },
    vehicleNumber: { type: String, required: true },

    washPackage: {
      packageName: { type: String, required: true },
      price: { type: Number, required: true },
      description: String,
      features: [String],
    },

    serviceType: {
      type: String,
      enum: ["Normal", "Express"],
      default: "Normal",
    },

    address: {
      street: String,
      maxCars: Number,
      city: String,
      pincode: String,
      location: {
        type: { type: String, default: "Point" },
        coordinates: [Number],
      },
    },

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

    expressCharge: { type: Number, default: 0 },
    advanceBookingCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: null },

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

    washerDetails: {
      washerId: { type: mongoose.Schema.Types.ObjectId, ref: "WasherEmployee" },
      fullName: { type: String },
      phone: { type: String },
      avgRating: { type: Number, default: 0 },
    },

    isWasherAccepted: { type: Boolean, default: false },

    progress: [
      {
        stage: {
          type: String,
          enum: [
            "Confirmed",
            "Pending",
            "Started",
            "On The Way",
            "Arrived",
            "Washing In Progress",
            "Completed",
          ],
        },
        time: String,
        status: { type: Boolean, default: "Pending" },
      },
    ],

    estimatedArrival: { type: String, default: null },

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

// ✅ Generate automatic order ID like #ORD10254
bookingSchema.pre("save", async function (next) {
  if (!this.orderId) {
    try {
      const lastBooking = await mongoose
        .model("Booking")
        .findOne({ orderId: { $exists: true } }) // ✅ only fetch bookings with orderId
        .sort({ createdAt: -1 });

      // ✅ Safely extract last number
      let lastNumber = 10000; // starting point

      if (lastBooking && lastBooking.orderId) {
        const num = parseInt(lastBooking.orderId.replace("#ORD", ""));
        if (!isNaN(num)) lastNumber = num;
      }

      this.orderId = `#ORD${lastNumber + 1}`;
      next();
    } catch (err) {
      console.error("Error generating orderId:", err);
      next(err);
    }
  } else {
    next();
  }
});

export default mongoose.model("Booking", bookingSchema);
