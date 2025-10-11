import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceEmployee", required: true },
  score: { type: Number, required: true, min: 1, max: 5 }, // or 0-10 as you prefer
  comment: { type: String, default: "" },
  serviceBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceBooking" } // optional link
}, { timestamps: true });

// prevent a customer from rating same booking/employee multiple times (optional)
// ratingSchema.index({ customerId: 1, employeeId: 1, serviceBookingId: 1 }, { unique: true });

export default mongoose.model("Rating", ratingSchema);
