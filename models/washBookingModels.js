import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Step 1: Vehicle info
    vehicleType: { type: String, enum: ["Car", "Bike"], required: true },
    vehicleNumber: { type: String, required: true },

    // Step 2: Package info
    washPackage: { type: String, enum: ["Basic", "Standard", "Premium"], required: true },
    serviceType: { type: String, enum: ["Normal", "Express"], default: "Normal" },

    // Step 3: Address
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

    // Step 4: Date & Time
    bookingDate: { type: Date }, // optional
    bookingTime: { type: String }, // optional

    // Step 5: Payment
    paymentMethod: { type: String, enum: ["Cash", "UPI", "Card"] },
    paymentStatus: { type: String, enum: ["Pending", "Completed", "Paid"], default: "Pending" },

    // Booking status
    status: { type: String, enum: ["Pending", "Confirmed", "Completed", "Cancelled"], default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
