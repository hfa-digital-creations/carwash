import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Optional targets: only one of these should exist per rating
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "WasherEmployee" },
  serviceBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerService" },
  customerShoppingId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerShopping" },
  washBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },

  score: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
   isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// Optional: enforce only one rating per target per customer
ratingSchema.index(
  { customerId: 1, employeeId: 1, serviceBookingId: 1, customerShoppingId: 1, washBookingId: 1 }, 
  { unique: true }
);

export default mongoose.model("Rating", ratingSchema);
